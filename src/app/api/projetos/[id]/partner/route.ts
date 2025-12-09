// app/api/projetos/[id]/partner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/connectDB'
import PartnerProject from '@/models/PartnerProject'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params // id = siteSlug, ex: 'white'
  const body = await req.json()

  const { partnerName, siteName, domain, buckpayStoreId, utmBase } = body

  try {
    await connectDB()

    // 🔐 pega usuário logado
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 },
      )
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 401 },
      )
    }

    const user = await User.findById(decoded.id).lean()
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const userId = user._id.toString()

    // 🔎 vê se esse site já existe
    const existing = await PartnerProject.findOne({ siteSlug: id }).lean()

    if (
      existing &&
      existing.ownerId &&
      existing.ownerId.toString() !== userId
    ) {
      // alguém já é dono desse site
      return NextResponse.json(
        { error: 'Este site já está vinculado a outro usuário.' },
        { status: 403 },
      )
    }

    const updated = await PartnerProject.findOneAndUpdate(
      { siteSlug: id },
      {
        siteSlug: id,
        partnerName: partnerName || existing?.partnerName || '',
        siteName: siteName || existing?.siteName || id,
        domain: domain ?? existing?.domain ?? '',
        buckpayStoreId:
          buckpayStoreId !== undefined
            ? buckpayStoreId
            : existing?.buckpayStoreId ?? null,
        utmBase: utmBase !== undefined ? utmBase : existing?.utmBase ?? null,

        // 🔹 se não tinha dono ainda, seta esse user como dono
        ownerId: existing?.ownerId || user._id,
        ownerEmail: existing?.ownerEmail || user.email,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean()

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[Projetos] Erro ao atualizar parceiro:', err)
    return NextResponse.json(
      { error: 'Erro ao atualizar parceiro.' },
      { status: 500 },
    )
  }
}
