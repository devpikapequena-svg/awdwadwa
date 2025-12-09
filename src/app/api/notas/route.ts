// app/api/notas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PartnerProject from '@/models/PartnerProject'
import PartnerPayment from '@/models/PartnerPayment'
import Order, { OrderDocument } from '@/models/Order'
import AdSpend from '@/models/AdSpend'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Period = 'today' | 'yesterday' | 'last7' | 'last30' | 'all'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000

function getPeriodRange(
  period: Period,
  referenceDateStr?: string,
): { start: Date; end: Date } {
  const nowUtc = new Date()
  let nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  // se veio referenceDate=YYYY-MM-DD, força o “hoje” para esse dia (igual dashboard)
  if (referenceDateStr) {
    const [y, m, d] = referenceDateStr.split('-').map(Number)
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      nowBrtFake = new Date(y, m - 1, d, 12, 0, 0, 0)
    }
  }

  const startBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0,
    0,
    0,
    0,
  )

  const endBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    23,
    59,
    59,
    999,
  )

  const ONE_DAY = 24 * 60 * 60 * 1000

  const startUtc = new Date(startBrt.getTime() + BRAZIL_OFFSET_MS)
  const endUtc = new Date(endBrt.getTime() + BRAZIL_OFFSET_MS)

  if (period === 'today') {
    return { start: startUtc, end: endUtc }
  }

  if (period === 'yesterday') {
    return {
      start: new Date(startUtc.getTime() - ONE_DAY),
      end: new Date(endUtc.getTime() - ONE_DAY),
    }
  }

  if (period === 'last7') {
    return {
      start: new Date(startUtc.getTime() - 6 * ONE_DAY),
      end: endUtc,
    }
  }

  if (period === 'last30') {
    return {
      start: new Date(startUtc.getTime() - 29 * ONE_DAY),
      end: endUtc,
    }
  }

  // all
  return { start: new Date(0), end: endUtc }
}

function getRefDatesForPeriod(
  period: Period,
  referenceDateStr?: string,
): string[] {
  const nowUtc = new Date()
  let nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)
  const ONE_DAY = 24 * 60 * 60 * 1000

  if (referenceDateStr) {
    const [y, m, d] = referenceDateStr.split('-').map(Number)
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      nowBrtFake = new Date(y, m - 1, d, 12, 0, 0, 0)
    }
  }

  const base = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0,
    0,
    0,
    0,
  )

  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`

  if (period === 'today') return [fmt(base)]
  if (period === 'yesterday') return [fmt(new Date(base.getTime() - ONE_DAY))]

  const days = period === 'last7' ? 6 : 29
  const result: string[] = []
  for (let i = days; i >= 0; i--) {
    result.push(fmt(new Date(base.getTime() - i * ONE_DAY)))
  }
  return result
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

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
    const partnerId = searchParams.get('partnerId')
    const periodParam = (searchParams.get('period') || 'today') as Period
    const referenceDateParam =
      searchParams.get('referenceDate') || undefined

    const validPeriods: Period[] = [
      'today',
      'yesterday',
      'last7',
      'last30',
      'all',
    ]
    const period: Period = validPeriods.includes(periodParam)
      ? periodParam
      : 'today'

    const { start, end } = getPeriodRange(period, referenceDateParam)

    // 🔹 PARCEIROS SOMENTE DO DONO LOGADO
    const partners = await PartnerProject.find({ ownerId }).lean()

    if (partners.length === 0) {
      return NextResponse.json({ partners: [] })
    }

    const partnerIds = partners.map((p: any) => String(p._id))
    const siteSlugs = partners.map((p: any) => p.siteSlug)

    // 🔹 PEDIDOS (apenas dos slugs desses sites)
    const orderFilter: any = {
      status: 'paid',
      gateway: { $in: ['buckpay', 'blackcat'] },
      siteSlug: { $in: siteSlugs },
    }

    if (period !== 'all') {
      orderFilter.createdAt = { $gte: start, $lte: end }
    }

    const orders = await Order.find(orderFilter).lean<OrderDocument[]>()

    // 🔹 PAGAMENTOS (apenas para esses partnerIds)
    const paymentFilter: any = {
      partnerId: { $in: partnerIds },
    }

    if (period !== 'all') {
      paymentFilter.createdAt = { $gte: start, $lte: end }
    }

    const payments = await PartnerPayment.find(paymentFilter).lean()

    // 🔹 ADS (já filtrando userId do dono)
    let adSpends: any[] = []

    if (period === 'all') {
      adSpends = await AdSpend.find({ userId: String(ownerId) }).lean()
    } else {
      const refDates = getRefDatesForPeriod(period, referenceDateParam)
      adSpends = await AdSpend.find({
        userId: String(ownerId),
        refDate: { $in: refDates },
      }).lean()
    }

    const partnerRows = partners.map((p: any) => {
      const id = String(p._id)

      const partnerOrders = orders.filter((o) => o.siteSlug === p.siteSlug)

      const totalGross = partnerOrders.reduce(
        (acc, o) => acc + (o.totalAmountInCents ?? 0) / 100,
        0,
      )

      const totalNetBeforeAds = partnerOrders.reduce(
        (acc, o) => acc + (o.netAmountInCents ?? 0) / 100,
        0,
      )

      const partnerAds = adSpends.filter((ad) => ad.siteSlug === p.siteSlug)
      const totalAds = partnerAds.reduce((a, b) => a + (b.amount ?? 0), 0)

      const totalNetAfterAds = Math.max(totalNetBeforeAds - totalAds, 0)

      const myCommission = totalNetAfterAds * 0.3

      const partnerPayments = payments.filter(
        (pg) => String(pg.partnerId) === id,
      )
      const totalPaid = partnerPayments.reduce(
        (a, b) => a + (b.amount ?? 0),
        0,
      )

      const balance = myCommission - totalPaid

      return {
        partnerId: id,
        partnerName: p.partnerName || 'Sem nome',
        siteName: p.siteName,
        siteSlug: p.siteSlug,

        totalGross: Number(totalGross.toFixed(2)),
        totalNet: Number(totalNetAfterAds.toFixed(2)),

        totalNetBeforeAds: Number(totalNetBeforeAds.toFixed(2)),
        adsTotal: Number(totalAds.toFixed(2)),

        myCommission: Number(myCommission.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        balance: Number(balance.toFixed(2)),

        payments: partnerPayments.map((pg) => ({
          id: String(pg._id),
          amount: pg.amount,
          note: pg.note || '',
          createdAt: pg.createdAt,
        })),
      }
    })

    if (partnerId) {
      const row = partnerRows.find((p) => p.partnerId === partnerId)
      return NextResponse.json(row || {})
    }

    return NextResponse.json({ partners: partnerRows })
  } catch (err) {
    console.log('[GET /api/notas] ERRO:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

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

    const { partnerId, amount, note, repDate } = await req.json()

    if (!partnerId || !amount) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // 🔐 garante que esse partnerId é de um site seu
    const partner = await PartnerProject.findOne({
      _id: partnerId,
      ownerId,
    }).lean()

    if (!partner) {
      return NextResponse.json(
        {
          error:
            'Parceiro não encontrado para este usuário ou não está vinculado à sua conta.',
        },
        { status: 403 },
      )
    }

    // monta createdAt baseado em repDate (YYYY-MM-DD) respeitando BRT
    let createdAt = new Date()
    if (typeof repDate === 'string') {
      const [y, m, d] = repDate.split('-').map(Number)
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
        const brtFake = new Date(y, m - 1, d, 12, 0, 0, 0)
        createdAt = new Date(brtFake.getTime() + BRAZIL_OFFSET_MS)
      }
    }

    const payment = await PartnerPayment.create({
      partnerId,
      amount,
      note: note || '',
      createdAt,
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('[POST /api/notas] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
