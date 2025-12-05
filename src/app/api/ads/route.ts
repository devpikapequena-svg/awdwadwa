// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import AdSpend from '@/models/AdSpend'
import PartnerProject from '@/models/PartnerProject'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000

function getTodayRefDate(): string {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  const y = nowBrtFake.getFullYear()
  const m = (nowBrtFake.getMonth() + 1).toString().padStart(2, '0')
  const d = nowBrtFake.getDate().toString().padStart(2, '0')

  return `${y}-${m}-${d}` // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD
    const refDate = dateParam || getTodayRefDate()

    const spends = await AdSpend.find({
      userId: String(user.id),
      refDate,
    })
      .sort({ createdAt: -1 })
      .lean()

    const totalSpent = spends.reduce((acc: number, ad: any) => acc + (ad.amount || 0), 0)

    const response = {
      refDate,
      totalSpent: Number(totalSpent.toFixed(2)),
      items: spends.map((s: any) => ({
        _id: String(s._id),
        siteSlug: s.siteSlug,
        siteName: s.siteName,
        refDate: s.refDate,
        amount: Number((s.amount || 0).toFixed(2)),
        notes: s.notes || null,
        createdAt: s.createdAt,
      })),
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/ads] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar gastos de ADS.' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { refDate, siteSlug, amount, notes } = body as {
      refDate?: string
      siteSlug?: string
      amount?: number
      notes?: string | null
    }

    if (!refDate || !siteSlug || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Dados inválidos. Informe refDate, siteSlug e amount > 0.' },
        { status: 400 },
      )
    }

    // Confere se site existe
    const project = await PartnerProject.findOne({ siteSlug }).lean()
    if (!project) {
      return NextResponse.json(
        { error: 'Site não encontrado para o slug informado.' },
        { status: 404 },
      )
    }

    const ad = await AdSpend.create({
      userId: String(user.id),
      siteSlug,
      siteName: project.siteName,
      refDate,
      amount,
      notes: notes || null,
    })

    return NextResponse.json(
      {
        _id: String(ad._id),
        siteSlug: ad.siteSlug,
        siteName: ad.siteName,
        refDate: ad.refDate,
        amount: ad.amount,
        notes: ad.notes,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[POST /api/ads] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao registrar gasto de ADS.' },
      { status: 500 },
    )
  }
}
