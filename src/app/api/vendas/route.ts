// app/api/vendas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'

type Period = 'today' | 'yesterday' | 'last7' | 'last30'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000 // diferença de Brasília para UTC (UTC-3)

/**
 * Calcula os períodos SEMPRE considerando dia de Brasília
 * (00:00 até 23:59:59 no fuso UTC-3), mesmo que o servidor esteja em UTC.
 */
function getPeriodRange(period?: string): {
  start: Date
  end: Date
  label: string
} {
  const nowUtc = new Date()

  // "Shift" para o horário de Brasília (fingindo que UTC é -3h)
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  // Início e fim do "hoje" nesse horário fake (meia-noite até 23:59:59.999)
  const startOfTodayBrtFake = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0,
    0,
    0,
    0,
  )

  const endOfTodayBrtFake = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    23,
    59,
    59,
    999,
  )

  // Converte esses limites de volta para UTC (que é o que está salvo no Mongo)
  const startOfTodayUtc = new Date(
    startOfTodayBrtFake.getTime() + BRAZIL_OFFSET_MS,
  )
  const endOfTodayUtc = new Date(
    endOfTodayBrtFake.getTime() + BRAZIL_OFFSET_MS,
  )

  // Helper de 1 dia em ms
  const ONE_DAY = 24 * 60 * 60 * 1000

  if (period === 'yesterday') {
    const startYesterdayBrtFake = new Date(
      startOfTodayBrtFake.getTime() - ONE_DAY,
    )
    const endYesterdayBrtFake = new Date(startOfTodayBrtFake.getTime() - 1)

    const start = new Date(
      startYesterdayBrtFake.getTime() + BRAZIL_OFFSET_MS,
    )
    const end = new Date(endYesterdayBrtFake.getTime() + BRAZIL_OFFSET_MS)

    return {
      start,
      end,
      label: 'Ontem',
    }
  }

  if (period === 'last7') {
    // últimos 7 dias = hoje + 6 dias pra trás, sempre em BRT
    const startLast7BrtFake = new Date(
      startOfTodayBrtFake.getTime() - 6 * ONE_DAY,
    )
    const start = new Date(startLast7BrtFake.getTime() + BRAZIL_OFFSET_MS)

    return {
      start,
      end: nowUtc, // até agora
      label: 'Últimos 7 dias',
    }
  }

  if (period === 'last30') {
    const startLast30BrtFake = new Date(
      startOfTodayBrtFake.getTime() - 29 * ONE_DAY,
    )
    const start = new Date(startLast30BrtFake.getTime() + BRAZIL_OFFSET_MS)

    return {
      start,
      end: nowUtc,
      label: 'Últimos 30 dias',
    }
  }

  // HOJE -> de meia-noite até AGORA no dia de Brasília
  // se você quiser "meia-noite às meia-noite" MESMO, troca `nowUtc` por `endOfTodayUtc`
  return {
    start: startOfTodayUtc,
    end: nowUtc,
    // se quiser “dia fechado”: end: endOfTodayUtc,
    label: 'Hoje',
  }
}


function mapStatusToFrontend(status: string): 'paid' | 'pending' | 'refunded' {
  const s = status.toLowerCase()

  if (s === 'paid' || s === 'approved') return 'paid'
  if (s === 'refunded' || s === 'chargeback' || s === 'canceled')
    return 'refunded'

  return 'pending'
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const periodParam = (searchParams.get('period') || 'today') as Period
    const siteParam = searchParams.get('site') // ex: ?site=white

    const { start, end, label } = getPeriodRange(periodParam)

    const filter: any = {
      createdAt: { $gte: start, $lte: end },
    }

    if (siteParam && siteParam !== 'all') {
      filter.siteSlug = siteParam
    }

    const docs = await Order.find(filter).sort({ createdAt: -1 }).lean()

    // ===== pega todos os slugs dos pedidos desse período =====
    const siteSlugs = Array.from(
      new Set(
        (docs as any[])
          .map((d) => d.siteSlug as string | undefined)
          .filter(Boolean),
      ),
    )

    // ===== busca configs de parceiro/site pra esses slugs =====
    const configs = await PartnerProject.find({
      siteSlug: { $in: siteSlugs },
    }).lean()

    const cfgBySlug = new Map(
      configs.map((c: any) => [c.siteSlug as string, c]),
    )

 // app/api/vendas/route.ts

type Sale = {
  id: string
  siteName: string
  partnerName: string
  buckpayOrderId?: string | null
  amount: number
  netAmount: number
  myCommission: number
  status: 'paid' | 'pending' | 'refunded'
  paymentMethod: 'pix' | 'card' | 'boleto' | string
  source?: string | null
  campaign?: string | null
  createdAt: string
  customerName?: string | null   // 👈 ADICIONA AQUI
}

const orders: Sale[] = (docs as any[]).map((doc) => {
  const totalCents = doc.totalAmountInCents || 0
  const netCents = doc.netAmountInCents || 0

  const amount = totalCents / 100
  const netAmount = netCents / 100
  const myCommission = netAmount * 0.3

  const status = mapStatusToFrontend(
    doc.status || doc.rawGatewayStatus || 'pending',
  )

  const slug: string = doc.siteSlug || 'Sem site'
  const cfg = cfgBySlug.get(slug)

  const siteName = cfg?.siteName || slug || 'Sem site'
  const partnerName = cfg?.partnerName || 'Não configurado'

  const utm = doc.utm || {}

  return {
    id: String(doc._id),
    siteName,
    partnerName,
    buckpayOrderId: doc.gatewayTransactionId || null,
    amount,
    netAmount,
    myCommission,
    status,
    paymentMethod: doc.paymentMethod || 'pix',
    source: utm.utm_source || utm.src || null,
    campaign: utm.utm_campaign || null,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),

    // 👇 PEGA O NOME DE QUEM GEROU / PAGOU
    customerName: doc.customer?.name || null,
  }
})


    const totalOrders = orders.length
    const totalGross = orders.reduce((acc, o) => acc + o.amount, 0)
    const totalNet = orders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotal = orders.reduce(
      (acc, o) => acc + o.myCommission,
      0,
    )
    const averageTicket =
      totalOrders > 0 ? totalGross / totalOrders : null

    const response = {
      summary: {
        periodLabel: label,
        totalOrders,
        totalGross,
        totalNet,
        myCommissionTotal,
        averageTicket,
      },
      orders,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/vendas] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar vendas.' },
      { status: 500 },
    )
  }
}
