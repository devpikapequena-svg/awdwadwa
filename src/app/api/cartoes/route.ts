// app/api/cartoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import CardLog, { CardStatus, CardLogDocument } from '@/models/CardLog'

type Period = 'today' | 'yesterday' | 'last7' | 'last30' | 'all'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  const startBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    0,0,0,0
  )

  const endBrt = new Date(
    nowBrtFake.getFullYear(),
    nowBrtFake.getMonth(),
    nowBrtFake.getDate(),
    23,59,59,999
  )

  const ONE_DAY = 24 * 60 * 60 * 1000

  const startUtc = new Date(startBrt.getTime() + BRAZIL_OFFSET_MS)
  const endUtc = new Date(endBrt.getTime() + BRAZIL_OFFSET_MS)

  if (period === 'today') return { start: startUtc, end: endUtc }

  if (period === 'yesterday')
    return {
      start: new Date(startUtc.getTime() - ONE_DAY),
      end: new Date(endUtc.getTime() - ONE_DAY),
    }

  if (period === 'last7')
    return {
      start: new Date(startUtc.getTime() - 6 * ONE_DAY),
      end: endUtc,
    }

  if (period === 'last30')
    return {
      start: new Date(startUtc.getTime() - 29 * ONE_DAY),
      end: endUtc,
    }

  return { start: new Date(0), end: endUtc }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    const periodParam = (searchParams.get('period') || 'today') as Period
    const statusParam = searchParams.get('status') as CardStatus | 'all' | null
    const search = (searchParams.get('search') || '').trim()

    const validPeriods: Period[] = ['today','yesterday','last7','last30','all']
    const period: Period = validPeriods.includes(periodParam) ? periodParam : 'today'

    const { start, end } = getPeriodRange(period)

    const query: any = {
      userId: String(user.id),
      createdAt: { $gte: start, $lte: end },
    }

    if (statusParam && statusParam !== 'all') query.status = statusParam

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { cardNumber: regex },
        { holderName: regex },
        { holderDocument: regex },
        { reason: regex },
      ]
    }

    const docs = await CardLog.find(query)
      .sort({ createdAt: -1 })
      .lean<CardLogDocument[]>()

    const cards = docs.map(d => ({
      id: String(d._id),
      cardNumber: d.cardNumber,
      cvv: d.cvv,
      expiry: d.expiry,
      holderName: d.holderName,
      holderDocument: d.holderDocument,
      status: d.status,
      reason: d.reason || null,
      createdAt: d.createdAt,
    }))

    const total = cards.length
    const approved = cards.filter(c => c.status === 'approved').length
    const rejected = cards.filter(c => c.status === 'rejected').length
    const unknown = cards.filter(c => c.status === 'unknown').length

    return NextResponse.json({
      cards,
      summary: { total, approved, rejected, unknown },
    })
  } catch (err) {
    console.error('[GET /api/cartoes] ERRO:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const {
      cardNumber,
      cvv,
      expiry,
      holderName,
      holderDocument,
      status,
      reason,
    } = body

    if (!cardNumber || !cvv || !expiry || !holderName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const log = await CardLog.create({
      userId: String(user.id),
      cardNumber,
      cvv,
      expiry,
      holderName,
      holderDocument,
      status: status || 'unknown',
      reason: reason || null,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, id: String(log._id) })
  } catch (err) {
    console.error('[POST /api/cartoes] ERRO:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
