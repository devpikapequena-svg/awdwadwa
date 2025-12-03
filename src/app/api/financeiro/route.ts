// app/api/financeiro/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb' // se no seu projeto padrão é '@/lib/connectDB', troca aqui
import Order, { OrderDocument } from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'
import PartnerPayment from '@/models/PartnerPayment'
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
    const siteParam = searchParams.get('site') // ex: ?site=white

    const { start, end, label } = getPeriodRange(periodParam)

    const filter: any = {
      createdAt: { $gte: start, $lte: end },
      gateway: 'buckpay',
    }

    if (siteParam && siteParam !== 'all') {
      filter.siteSlug = siteParam
    }

    // ===== BUSCA PEDIDOS DO PERÍODO =====
    const docs = await Order.find(filter).sort({ createdAt: -1 }).lean<OrderDocument[]>()

    // ===== BUSCA CONFIGS DE SITE/PARCEIRO =====
    const siteSlugs = Array.from(
      new Set(
        docs
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

    const mappedOrders: Sale[] = docs.map((doc) => {
      const totalCents = doc.totalAmountInCents || 0
      const netCents = doc.netAmountInCents || 0

      const amount = totalCents / 100
      const netAmount = netCents / 100
      const myCommission = netAmount * 0.3

      const status = mapStatusToFrontend(
        (doc.status as string) || doc.rawGatewayStatus || 'pending',
      )

      const slug: string = (doc.siteSlug as string) || 'Sem site'
      const cfg = cfgBySlug.get(slug)

      const siteName = cfg?.siteName || slug || 'Sem site'
      const partnerName = cfg?.partnerName || 'Não configurado'

      const utm: any = doc.utm || {}

      return {
        id: String(doc._id),
        siteName,
        partnerName,
        buckpayOrderId: doc.gatewayTransactionId || null,
        amount,
        netAmount,
        myCommission,
        status,
        paymentMethod: (doc.paymentMethod as string) || 'pix',
        source: utm.utm_source || utm.src || null,
        campaign: utm.utm_campaign || null,
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString(),
      }
    })

    // 🔥 AQUI FILTRA SÓ OS PAGOS PARA O RESUMO FINANCEIRO
    const paidOrders = mappedOrders.filter((o) => o.status === 'paid')

    const totalOrders = paidOrders.length
    const totalGross = paidOrders.reduce((acc, o) => acc + o.amount, 0)
    const totalNet = paidOrders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotal = paidOrders.reduce(
      (acc, o) => acc + o.myCommission,
      0,
    )
    const averageTicket =
      totalOrders > 0 ? totalGross / totalOrders : null

    // ===== BLOCO DE COMISSÕES & REPASSES (MESMA BASE DO /api/relatorios) =====
    const allPaidOrders = await Order.find({
      gateway: 'buckpay',
      status: 'paid',
    }).lean<OrderDocument[]>()

    const partners = await PartnerProject.find().lean()
    const payments = await PartnerPayment.find().lean()

    const partnerRows = partners.map((p: any) => {
      const id = p._id.toString()

      const partnerOrders = allPaidOrders.filter(
        (o) => o.siteSlug === p.siteSlug,
      )

      const totalGrossPartner = partnerOrders.reduce(
        (acc, o) => acc + (o.totalAmountInCents ?? 0) / 100,
        0,
      )

      const totalNetPartner = partnerOrders.reduce(
        (acc, o) => acc + (o.netAmountInCents ?? 0) / 100,
        0,
      )

      const myCommissionPartner = totalNetPartner * 0.3

      const partnerPayments = payments.filter(
        (pg: any) => String(pg.partnerId) === id,
      )

      const totalPaidPartner = partnerPayments.reduce(
        (acc, pg: any) => acc + (pg.amount ?? 0),
        0,
      )

      const balance = myCommissionPartner - totalPaidPartner

      return {
        partnerId: id,
        partnerName: p.partnerName || 'Sem nome',
        siteSlug: p.siteSlug,
        siteName: p.siteName || p.siteSlug,

        totalGross: Number(totalGrossPartner.toFixed(2)),
        totalNet: Number(totalNetPartner.toFixed(2)),
        myCommission: Number(myCommissionPartner.toFixed(2)),
        totalPaid: Number(totalPaidPartner.toFixed(2)),
        balance: Number(balance.toFixed(2)),

        payments: partnerPayments.map((pg: any) => ({
          id: String(pg._id),
          amount: pg.amount,
          note: pg.note || '',
          createdAt: pg.createdAt,
        })),
      }
    })

    const response = {
      summary: {
        periodLabel: label,
        totalOrders,
        totalGross,        // só pagos
        totalNet,          // só pagos
        myCommissionTotal, // só pagos
        averageTicket,     // só pagos
      },
      orders: paidOrders,   // só pagos (pra usar nas últimas vendas)
      partners: partnerRows,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/financeiro] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao montar resumo financeiro.' },
      { status: 500 },
    )
  }
}
