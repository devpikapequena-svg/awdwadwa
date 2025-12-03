// app/api/projetos/[id]/partner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import PartnerProject from '@/models/PartnerProject'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params      // id = siteSlug, ex: 'white'
  const body = await req.json()

  const {
    partnerName,
    siteName,
    domain,
    buckpayStoreId,
    utmBase,
  } = body

  try {
    await connectDB()

    const updated = await PartnerProject.findOneAndUpdate(
      { siteSlug: id },
      {
        siteSlug: id,
        partnerName: partnerName || '',
        siteName: siteName || id,
        domain: domain || '',
        buckpayStoreId: buckpayStoreId ?? null,
        utmBase: utmBase ?? null,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean()

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[Projetos] Erro ao atualizar parceiro:', err)
    return NextResponse.json(
      { error: 'Erro ao atualizar parceiro.' },
      { status: 500 }
    )
  }
}
