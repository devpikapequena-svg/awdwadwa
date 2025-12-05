// app/api/notas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PartnerProject from '@/models/PartnerProject'
import PartnerPayment from '@/models/PartnerPayment'
import Order, { OrderDocument } from '@/models/Order'
import AdSpend from '@/models/AdSpend'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Period = 'today' | 'yesterday' | 'last7' | 'last30'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-3

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const nowUtc = new Date()

  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

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
    return { start, end }
  }

  if (period === 'last7') {
    const startLast7BrtFake = new Date(
      startOfTodayBrtFake.getTime() - 6 * ONE_DAY,
    )
    const start = new Date(startLast7BrtFake.getTime() + BRAZIL_OFFSET_MS)
    return { start, end: nowUtc }
  }

  if (period === 'last30') {
    const startLast30BrtFake = new Date(
      startOfTodayBrtFake.getTime() - 29 * ONE_DAY,
    )
    const start = new Date(startLast30BrtFake.getTime() + BRAZIL_OFFSET_MS)
    return { start, end: nowUtc }
  }

  // today
  return {
    start: startOfTodayUtc,
    end: nowUtc,
  }
}

// gera lista de refDate (YYYY-MM-DD) pros dias do período usando fuso de Brasília
function getRefDatesForPeriod(period: Period): string[] {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  const ONE_DAY = 24 * 60 * 60 * 1000

  const base = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0,
    0,
    0,
    0,
  )

  const format = (d: Date) => {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (period === 'today') {
    return [format(base)]
  }

  if (period === 'yesterday') {
    const yest = new Date(base.getTime() - ONE_DAY)
    return [format(yest)]
  }

  if (period === 'last7') {
    const result: string[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(base.getTime() - i * ONE_DAY)
      result.push(format(d))
    }
    return result
  }

  // last30
  const result: string[] = []
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(base.getTime() - i * ONE_DAY)
    result.push(format(d))
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

    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')
    const periodParam = searchParams.get('period') as Period | null

    const validPeriods: Period[] = ['today', 'yesterday', 'last7', 'last30']
    const hasPeriod = periodParam && validPeriods.includes(periodParam)

    // 🔹 parceiros (config de site + nome do parceiro)
    const partners = await PartnerProject.find().lean()

    // 🔹 pedidos (filtrando por período se tiver)
    const orderFilter: any = {
      gateway: 'buckpay',
      status: 'paid',
    }

    if (hasPeriod) {
      const { start, end } = getPeriodRange(periodParam!)
      orderFilter.createdAt = { $gte: start, $lte: end }
    }

    const orders = await Order.find(orderFilter).lean<OrderDocument[]>()

    // 🔹 pagamentos (AGORA TAMBÉM por período)
    let payments: any[] = []
    if (hasPeriod) {
      const { start, end } = getPeriodRange(periodParam!)
      payments = await PartnerPayment.find({
        createdAt: { $gte: start, $lte: end },
      }).lean()
    } else {
      // visão geral: todos os pagamentos
      payments = await PartnerPayment.find().lean()
    }

    // 🔹 gastos de ADS do usuário, por período + site
    let adSpends: any[] = []
    if (hasPeriod) {
      const refDates = getRefDatesForPeriod(periodParam!)
      adSpends = await AdSpend.find({
        userId: String(user.id),
        refDate: { $in: refDates },
      }).lean()
    } else {
      // sem período -> todos ADS do usuário
      adSpends = await AdSpend.find({
        userId: String(user.id),
      }).lean()
    }

    const partnerRows = partners.map((p: any) => {
      const id = p._id.toString()

      // Pedidos desse parceiro = todos pedidos do siteSlug dele
      const partnerOrders = orders.filter((o) => o.siteSlug === p.siteSlug)

      // Faturamento bruto (totalAmountInCents -> R$)
      const totalGross = partnerOrders.reduce(
        (acc, o) => acc + (o.totalAmountInCents ?? 0) / 100,
        0,
      )

      // Lucro líquido (netAmountInCents -> R$) ANTES de descontar ADS
      const totalNetBeforeAds = partnerOrders.reduce(
        (acc, o) => acc + (o.netAmountInCents ?? 0) / 100,
        0,
      )

      // Gasto de ADS desse site no período selecionado
      const partnerAds = adSpends.filter(
        (ad) => ad.siteSlug === p.siteSlug,
      )

      const totalAds = partnerAds.reduce(
        (acc, ad) => acc + (ad.amount ?? 0),
        0,
      )

      // Lucro líquido real = líquido - ADS (não deixo negativo)
      const totalNetAfterAds = Math.max(totalNetBeforeAds - totalAds, 0)

      // Sua parte: 30% do lucro após descontar ADS
      const myCommission = totalNetAfterAds * 0.3

      // Pagamentos desse parceiro (já filtrados por período lá em cima)
      const partnerPayments = payments.filter(
        (pg: any) => String(pg.partnerId) === id,
      )

      const totalPaid = partnerPayments.reduce(
        (acc, pg: any) => acc + (pg.amount ?? 0),
        0,
      )

      const balance = myCommission - totalPaid

      return {
        partnerId: id,
        partnerName: p.partnerName || 'Sem nome',
        siteSlug: p.siteSlug,
        siteName: p.siteName || p.siteSlug,

        // bruto e líquido ANTES de ADS (referência)
        totalGross: Number(totalGross.toFixed(2)),
        totalNet: Number(totalNetBeforeAds.toFixed(2)),

        // comissão já com ADS descontado
        myCommission: Number(myCommission.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        balance: Number(balance.toFixed(2)),

        // histórico mostrado também respeita o período
        payments: partnerPayments.map((pg: any) => ({
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
    console.error('[GET /api/notas] erro:', err)
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

    const { partnerId, amount, note } = await req.json()

    if (!partnerId || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 },
      )
    }

    const payment = await PartnerPayment.create({
      partnerId,
      amount,
      note: note || '',
      createdAt: new Date(),
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('[POST /api/notas] erro:', err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 },
    )
  }
}
