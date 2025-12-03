// src/app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

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

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const periodParam = (searchParams.get('period') || 'today') as Period

    const { start, end, label } = getPeriodRange(periodParam)

    const filter: any = {
      createdAt: { $gte: start, $lte: end },
      gateway: 'buckpay',
    }

    const docs = await Order.find(filter).sort({ createdAt: -1 }).lean()

    // slugs de site presentes nesse período
    const siteSlugs = Array.from(
      new Set(
        (docs as any[])
          .map((d) => d.siteSlug as string | undefined)
          .filter(Boolean),
      ),
    )

    const configs = await PartnerProject.find({
      siteSlug: { $in: siteSlugs },
    }).lean()

    const cfgBySlug = new Map(
      configs.map((c: any) => [c.siteSlug as string, c]),
    )

    // ====== Mapeia pedidos pro frontend ======
    type OrderSummary = {
      id: string
      siteName: string
      buyerName?: string
      amount: number
      profit: number
      myCommission: number
      status: 'paid' | 'pending' | 'refunded'
      createdAt: string
      source?: string
    }

    // todos os pedidos do período
    const allOrders: OrderSummary[] = (docs as any[]).map((doc) => {
      const totalCents = doc.totalAmountInCents || 0
      const netCents = doc.netAmountInCents || 0

      const amount = totalCents / 100
      const profit = netCents / 100
      const myCommission = profit * 0.3

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
        buyerName: doc.buyerName || '',
        amount,
        profit,
        myCommission,
        status,
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString(),
        source: utm.utm_source || utm.src || null,
      }
    })

    // <<< AQUI: só pedidos pagos >>>
    const orders = allOrders.filter((o) => o.status === 'paid')

    const totalOrders = orders.length
    const totalGross = orders.reduce((acc, o) => acc + o.amount, 0)
    const totalNet = orders.reduce((acc, o) => acc + o.profit, 0)
    const myCommissionTotal = orders.reduce(
      (acc, o) => acc + o.myCommission,
      0,
    )
    const averageTicket =
      totalOrders > 0 ? totalGross / totalOrders : null

    // ====== Resumo por site/parceiro (PartnerSummary) ======
    type PartnerSummaryLocal = {
      id: string
      name: string
      siteName: string
      totalOrders: number
      totalGross: number
      totalNet: number
      myCommission: number
    }

    const partnerMap = new Map<string, PartnerSummaryLocal>()

    orders.forEach((o) => {
      const cfg = configs.find((c: any) => c.siteName === o.siteName)
      const id = cfg ? String(cfg._id) : o.siteName
      const partnerName = cfg?.partnerName || 'Não configurado'
      const siteName = cfg?.siteName || o.siteName

      const key = `${id}`

      if (!partnerMap.has(key)) {
        partnerMap.set(key, {
          id,
          name: partnerName,
          siteName,
          totalOrders: 0,
          totalGross: 0,
          totalNet: 0,
          myCommission: 0,
        })
      }

      const current = partnerMap.get(key)!
      current.totalOrders += 1
      current.totalGross += o.amount
      current.totalNet += o.profit
      current.myCommission += o.myCommission
    })

    const partners = Array.from(partnerMap.values())

    // ====== Série diária para gráfico ======
    type DailyBucket = {
      totalGross: number
      totalNet: number
      myCommission: number
      orders: number
    }

    const dailyMap = new Map<string, DailyBucket>()

    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      const dayKey = `${d.getFullYear()}-${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          totalGross: 0,
          totalNet: 0,
          myCommission: 0,
          orders: 0,
        })
      }

      const bucket = dailyMap.get(dayKey)!
      bucket.totalGross += o.amount
      bucket.totalNet += o.profit
      bucket.myCommission += o.myCommission
      bucket.orders += 1
    })

    const dailySeries = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, bucket]) => ({
        date,
        totalGross: Number(bucket.totalGross.toFixed(2)),
        totalNet: Number(bucket.totalNet.toFixed(2)),
        myCommission: Number(bucket.myCommission.toFixed(2)),
        orders: bucket.orders,
      }))

    // ====== Últimos pedidos (apenas pagos) ======
    const lastOrders = orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10)

    const response = {
      periodLabel: label,
      totalOrders,
      totalGross: Number(totalGross.toFixed(2)),
      totalNet: Number(totalNet.toFixed(2)),
      myCommissionTotal: Number(myCommissionTotal.toFixed(2)),
      averageTicket: averageTicket ? Number(averageTicket.toFixed(2)) : null,
      partners,
      lastOrders,
      dailySeries,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/dashboard/summary] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo do dashboard.' },
      { status: 500 },
    )
  }
}
