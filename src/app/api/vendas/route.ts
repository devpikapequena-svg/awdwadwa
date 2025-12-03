// app/api/vendas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'

type Period = 'today' | 'yesterday' | 'last7' | 'last30'

function getPeriodRange(period?: string): {
  start: Date
  end: Date
  label: string
} {
  const now = new Date()

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  )

  if (period === 'yesterday') {
    const start = new Date(startOfToday)
    start.setDate(start.getDate() - 1)
    const end = new Date(startOfToday)
    end.setMilliseconds(end.getMilliseconds() - 1)
    return {
      start,
      end,
      label: 'Ontem',
    }
  }

  if (period === 'last7') {
    const start = new Date(startOfToday)
    start.setDate(start.getDate() - 6)
    return {
      start,
      end: now,
      label: 'Últimos 7 dias',
    }
  }

  if (period === 'last30') {
    const start = new Date(startOfToday)
    start.setDate(start.getDate() - 29)
    return {
      start,
      end: now,
      label: 'Últimos 30 dias',
    }
  }

  return {
    start: startOfToday,
    end: now,
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
