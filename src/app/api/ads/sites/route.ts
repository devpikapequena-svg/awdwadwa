// src/app/api/ads/sites/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import PartnerProject from '@/models/PartnerProject'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await PartnerProject.find({})
      .sort({ siteName: 1 })
      .lean()

    const items = (projects as any[]).map((p) => ({
      siteSlug: p.siteSlug,
      siteName: p.siteName,
      partnerName: p.partnerName,
      domain: p.domain || '',
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[GET /api/ads/sites] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar sites para ADS.' },
      { status: 500 },
    )
  }
}
