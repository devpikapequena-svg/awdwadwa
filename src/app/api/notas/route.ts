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

//
// 🔥 MESMA LÓGICA DO DASHBOARD SUMMARY → FUNCIONA 100%
//
function getPeriodRange(period: Period): { start: Date; end: Date } {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  // 00:00 e 23:59 no horário brasileiro
  const startBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0, 0, 0, 0
  )

  const endBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    23, 59, 59, 999
  )

  const ONE_DAY = 24 * 60 * 60 * 1000

  const startUtc = new Date(startBrt.getTime() + BRAZIL_OFFSET_MS)
  const endUtc   = new Date(endBrt.getTime() + BRAZIL_OFFSET_MS)

  if (period === 'today') {
    return { start: startUtc, end: endUtc }
  }

  if (period === 'yesterday') {
    return {
      start: new Date(startUtc.getTime() - ONE_DAY),
      end:   new Date(endUtc.getTime()   - ONE_DAY),
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

//
// 🔥 LISTA DE DIAS PARA ADS (idêntico ao dashboard)
//
function getRefDatesForPeriod(period: Period): string[] {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)
  const ONE_DAY = 24 * 60 * 60 * 1000

  const base = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0, 0, 0, 0
  )

  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

  if (period === 'today') return [fmt(base)]
  if (period === 'yesterday') return [fmt(new Date(base.getTime() - ONE_DAY))]

  const days = period === 'last7' ? 6 : 29
  const result: string[] = []
  for (let i = days; i >= 0; i--) {
    result.push(fmt(new Date(base.getTime() - i * ONE_DAY)))
  }
  return result
}

//
// 🔥 ENDPOINT GET — TOTALMENTE REFEITO E CORRIGIDO
//
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')
    const periodParam = (searchParams.get('period') || 'today') as Period

    const validPeriods: Period[] = ['today','yesterday','last7','last30','all']
    const period: Period = validPeriods.includes(periodParam) ? periodParam : 'today'

    const { start, end } = getPeriodRange(period)

    //
    // 🔥 PEDIDOS
    //
const orderFilter: any = { 
  status: 'paid',
  gateway: { $in: ['buckpay', 'blackcat'] },
}

    if (period !== 'all') {
      orderFilter.createdAt = { $gte: start, $lte: end }
    }

    const orders = await Order.find(orderFilter).lean<OrderDocument[]>()

    //
    // 🔥 PARCEIROS
    //
    const partners = await PartnerProject.find().lean()

    //
    // 🔥 PAGAMENTOS
    //
    let payments: any[] = []

    if (period === 'all') {
      payments = await PartnerPayment.find().lean()
    } else {
      payments = await PartnerPayment.find({
        createdAt: { $gte: start, $lte: end },
      }).lean()
    }

    //
    // 🔥 ADS
    //
    let adSpends: any[] = []

    if (period === 'all') {
      adSpends = await AdSpend.find({ userId: String(user.id) }).lean()
    } else {
      const refDates = getRefDatesForPeriod(period)
      adSpends = await AdSpend.find({
        userId: String(user.id),
        refDate: { $in: refDates },
      }).lean()
    }

    //
    // 🔥 MONTAGEM DOS DADOS POR PARCEIRO
    //
    const partnerRows = partners.map((p: any) => {
      const id = String(p._id)

      const partnerOrders = orders.filter((o) => o.siteSlug === p.siteSlug)

      const totalGross = partnerOrders.reduce(
        (acc, o) => acc + (o.totalAmountInCents ?? 0) / 100,
        0
      )

      const totalNetBeforeAds = partnerOrders.reduce(
        (acc, o) => acc + (o.netAmountInCents ?? 0) / 100,
        0
      )

      const partnerAds = adSpends.filter((ad) => ad.siteSlug === p.siteSlug)
      const totalAds = partnerAds.reduce((a, b) => a + (b.amount ?? 0), 0)

      const totalNetAfterAds = Math.max(totalNetBeforeAds - totalAds, 0)

      const myCommission = totalNetAfterAds * 0.3

      const partnerPayments = payments.filter((pg) => String(pg.partnerId) === id)
      const totalPaid = partnerPayments.reduce((a, b) => a + (b.amount ?? 0), 0)

      const balance = myCommission - totalPaid

      return {
        partnerId: id,
        partnerName: p.partnerName || 'Sem nome',
        siteName: p.siteName,
        siteSlug: p.siteSlug,

        totalGross: Number(totalGross.toFixed(2)),
        totalNet: Number(totalNetBeforeAds.toFixed(2)),
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

//
// 🔥 ENDPOINT POST — SEM ALTERAÇÕES
//
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { partnerId, amount, note } = await req.json()

    if (!partnerId || !amount) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
