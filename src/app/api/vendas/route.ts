// app/api/vendas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Period = 'today' | 'yesterday' | 'last7' | 'last30'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000 // diferença de Brasília para UTC (UTC-3)

/**
 * Mesma lógica do dashboard:
 * aceita period + referenceDate (YYYY-MM-DD)
 * e SEMPRE considera dia fechado em BRT (00:00–23:59).
 */
function getPeriodRange(
  period?: string,
  referenceDateStr?: string,
): {
  start: Date
  end: Date
  label: string
} {
  const nowUtc = new Date()

  // base no horário de Brasília “fake”
  let nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  // se veio referenceDate=YYYY-MM-DD, força o “hoje” pra esse dia
  if (referenceDateStr) {
    const [y, m, d] = referenceDateStr.split('-').map(Number)
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      nowBrtFake = new Date(y, m - 1, d, 12, 0, 0, 0)
    }
  }

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

  const startOfTodayUtc = new Date(
    startOfTodayBrtFake.getTime() + BRAZIL_OFFSET_MS,
  )
  const endOfTodayUtc = new Date(
    endOfTodayBrtFake.getTime() + BRAZIL_OFFSET_MS,
  )

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
    const startLast7BrtFake = new Date(
      startOfTodayBrtFake.getTime() - 6 * ONE_DAY,
    )
    const start = new Date(startLast7BrtFake.getTime() + BRAZIL_OFFSET_MS)

    return {
      start,
      end: endOfTodayUtc,
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
      end: endOfTodayUtc,
      label: 'Últimos 30 dias',
    }
  }

  // padrão: 1 dia (hoje ou referenceDate) de 00:00 até 23:59 BRT
  return {
    start: startOfTodayUtc,
    end: endOfTodayUtc,
    label: referenceDateStr ? referenceDateStr : 'Hoje',
  }
}

function mapStatusToFrontend(status: string): 'paid' | 'pending' | 'med' {
  const s = status.toLowerCase()

  if (s === 'paid' || s === 'approved') return 'paid'
  if (s === 'med' || s === 'chargeback' || s === 'canceled') return 'med'

  return 'pending'
}

// ===== TIPO USADO NO FRONT =====
type Sale = {
  id: string
  siteName: string
  partnerName: string
  buckpayOrderId?: string | null
  amount: number
  netAmount: number
  myCommission: number
  status: 'paid' | 'pending' | 'med'
  paymentMethod: 'pix' | 'card' | 'boleto' | string
  source?: string | null
  campaign?: string | null
  createdAt: string
  customerName?: string | null
  gateway: 'buckpay' | 'blackcat' | string
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // 🔐 pega usuário logado (mesma lógica do summary)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownerId =
      (user as any).id ?? (user as any)._id?.toString()

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Usuário inválido.' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(req.url)
    const periodParam = (searchParams.get('period') || 'today') as Period
    const referenceDateParam =
      searchParams.get('referenceDate') || undefined
    const siteParam = searchParams.get('site') // ex: ?site=white

    const { start, end, label } = getPeriodRange(
      periodParam,
      referenceDateParam,
    )

    // 🔹 pega SOMENTE os sites VINCULADOS a esse usuário
    const myConfigs = await PartnerProject.find({
      ownerId: ownerId,
    }).lean()

    if (myConfigs.length === 0) {
      // sem site vinculado = sem vendas
      return NextResponse.json({
        summary: {
          periodLabel: label,
          totalOrders: 0,
          totalGross: 0,
          totalNet: 0,
          myCommissionTotal: 0,
          averageTicket: null,
        },
        orders: [],
      })
    }

    const allowedSlugs = myConfigs.map((c: any) => c.siteSlug as string)

    // 🔹 filtro base (período + slugs que pertencem ao dono)
    const filter: any = {
      createdAt: { $gte: start, $lte: end },
      siteSlug: { $in: allowedSlugs },
    }

    // se veio ?site=slug, restringe mais ainda
    if (siteParam && siteParam !== 'all') {
      // se o slug pedido não é do dono → resposta vazia
      if (!allowedSlugs.includes(siteParam)) {
        return NextResponse.json({
          summary: {
            periodLabel: label,
            totalOrders: 0,
            totalGross: 0,
            totalNet: 0,
            myCommissionTotal: 0,
            averageTicket: null,
          },
          orders: [],
        })
      }

      filter.siteSlug = siteParam
    }

    const docs = await Order.find(filter).sort({ createdAt: -1 }).lean()

    // configs só dos sites do dono
    const cfgBySlug = new Map(
      myConfigs.map((c: any) => [c.siteSlug as string, c]),
    )

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
      const gateway: string = doc.gateway || 'unknown'

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
        customerName: doc.customer?.name || null,
        gateway: gateway as 'buckpay' | 'blackcat' | string,
      }
    })

    // ⬇️ SÓ SOMA EM CIMA DOS PAGOS
    const paidOrders = orders.filter((o) => o.status === 'paid')

    const totalOrders = paidOrders.length
    const totalGross = paidOrders.reduce((acc, o) => acc + o.amount, 0)
    const totalNet = paidOrders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotal = paidOrders.reduce(
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
      // tabela continua vendo TODOS os pedidos desse dono, inclusive pendente/med
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
