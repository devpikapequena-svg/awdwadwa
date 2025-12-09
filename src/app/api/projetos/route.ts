// app/api/projetos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import PartnerProject from '@/models/PartnerProject'
import { User } from '@/models/User'

type ProjectStatus = 'active' | 'paused' | 'no_sales'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

// ==================== GET /api/projetos ====================
export async function GET(req: NextRequest) {
  try {
    console.log('================ [Projetos][GET] ==================')

    await connectDB()
    console.log('[Projetos][GET] DB conectado')

    // 🔐 pega usuário logado pelo cookie auth_token
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    console.log('[Projetos][GET] Cookie auth_token:', token)

    if (!token) {
      console.log('[Projetos][GET] Sem token, retornando 401')
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 },
      )
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('[Projetos][GET] Token decodificado:', decoded)
    } catch (e) {
      console.error('[Projetos][GET] Erro ao verificar token:', e)
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 401 },
      )
    }

    const user = await User.findById(decoded.id).lean()
    console.log(
      '[Projetos][GET] User encontrado:',
      user?._id?.toString(),
      user?.email,
    )

    if (!user) {
      console.log('[Projetos][GET] Usuário não encontrado, 404')
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const userId = user._id.toString()
    console.log('[Projetos][GET] userId para filtro ownerId:', userId)

    // 1) SITES DESSE DONO
    const configs = await PartnerProject.find({
      ownerId: userId,
    }).lean()

    console.log(
      `[Projetos][GET] PartnerProject encontrados para ownerId=${userId}:`,
      configs.length,
    )
    console.log(
      '[Projetos][GET] Slugs dos configs:',
      configs.map((c) => ({
        siteSlug: c.siteSlug,
        ownerId: c.ownerId,
        ownerEmail: c.ownerEmail,
      })),
    )

    if (configs.length === 0) {
      console.log(
        '[Projetos][GET] Nenhum config com esse ownerId, retornando []',
      )
      return NextResponse.json([])
    }

    const slugs = configs.map((c) => c.siteSlug)
    console.log('[Projetos][GET] Slugs usados pra buscar orders:', slugs)

    // 2) ORDENS SÓ DESSES SLUGS
    const orders = await Order.find({
      status: 'paid',
      gateway: { $in: ['buckpay', 'blackcat'] },
      siteSlug: { $in: slugs },
    }).lean()

    console.log('[Projetos][GET] Orders encontradas:', orders.length)

    type ProjectAgg = {
      siteSlug: string
      totalOrders: number
      totalGross: number
      totalNet: number
      myCommissionTotal: number
      lastOrderAt: Date | null
    }

    const map = new Map<string, ProjectAgg>()

    for (const o of orders as any[]) {
      const siteSlug: string = o.siteSlug || 'desconhecido'

      const totalAmountInCents: number = o.totalAmountInCents ?? 0
      const netAmountInCents: number = o.netAmountInCents ?? 0

      const grossReais = totalAmountInCents / 100
      const netReais = netAmountInCents / 100
      const myCommissionReais = netReais * 0.3

      const createdAt: Date =
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt)

      if (!map.has(siteSlug)) {
        map.set(siteSlug, {
          siteSlug,
          totalOrders: 0,
          totalGross: 0,
          totalNet: 0,
          myCommissionTotal: 0,
          lastOrderAt: null,
        })
      }

      const agg = map.get(siteSlug)!
      agg.totalOrders += 1
      agg.totalGross += grossReais
      agg.totalNet += netReais
      agg.myCommissionTotal += myCommissionReais

      if (!agg.lastOrderAt || createdAt > agg.lastOrderAt) {
        agg.lastOrderAt = createdAt
      }
    }

    console.log(
      '[Projetos][GET] Aggregations por siteSlug:',
      Array.from(map.values()),
    )

    // 3) RESPOSTA
    const projects = configs.map((cfg: any) => {
      const agg =
        map.get(cfg.siteSlug) || {
          siteSlug: cfg.siteSlug,
          totalOrders: 0,
          totalGross: 0,
          totalNet: 0,
          myCommissionTotal: 0,
          lastOrderAt: null,
        }

      let status: ProjectStatus = 'no_sales'
      if (agg.totalOrders > 0) status = 'active'

      return {
        id: cfg.siteSlug,
        siteSlug: cfg.siteSlug,

        partnerName: cfg.partnerName || '',
        siteName: cfg.siteName || cfg.siteSlug,
        domain: cfg.domain || '',
        buckpayStoreId: cfg.buckpayStoreId ?? null,
        utmBase: cfg.utmBase ?? null,

        totalOrders: agg.totalOrders,
        totalGross: Number(agg.totalGross.toFixed(2)),
        totalNet: Number(agg.totalNet.toFixed(2)),
        myCommissionTotal: Number(agg.myCommissionTotal.toFixed(2)),

        status,
        lastOrderAt: agg.lastOrderAt ? agg.lastOrderAt.toISOString() : null,
      }
    })

    console.log(
      '[Projetos][GET] Projects montados para resposta:',
      projects.length,
    )
    console.log(
      '[Projetos][GET] Projects resumidos:',
      projects.map((p) => ({
        siteSlug: p.siteSlug,
        partnerName: p.partnerName,
        totalOrders: p.totalOrders,
        totalGross: p.totalGross,
        myCommissionTotal: p.myCommissionTotal,
      })),
    )

    return NextResponse.json(projects)
  } catch (err) {
    console.error('[Projetos] Erro ao listar projetos:', err)
    return NextResponse.json(
      { error: 'Erro interno ao listar projetos.' },
      { status: 500 },
    )
  }
}

// ==================== POST /api/projetos ====================
export async function POST(req: NextRequest) {
  try {
    console.log('================ [Projetos][POST] ==================')

    await connectDB()
    console.log('[Projetos][POST] DB conectado')

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    console.log('[Projetos][POST] Cookie auth_token:', token)

    if (!token) {
      console.log('[Projetos][POST] Sem token, 401')
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 },
      )
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('[Projetos][POST] Token decodificado:', decoded)
    } catch (e) {
      console.error('[Projetos][POST] Erro ao verificar token:', e)
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 401 },
      )
    }

    const user = await User.findById(decoded.id).lean()
    console.log(
      '[Projetos][POST] User encontrado:',
      user?._id?.toString(),
      user?.email,
    )

    if (!user) {
      console.log('[Projetos][POST] Usuário não encontrado, 404')
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const userId = user._id.toString()
    const body = await req.json()

    console.log('[Projetos][POST] Body recebido:', body)
    console.log('[Projetos][POST] userId:', userId)

    const {
      siteSlug,
      siteName,
      partnerName,
      domain,
      buckpayStoreId,
      utmBase,
    } = body

    if (!siteSlug || !siteName || !partnerName) {
      console.log('[Projetos][POST] Campos obrigatórios faltando', {
        siteSlug,
        siteName,
        partnerName,
      })
      return NextResponse.json(
        { error: 'Preencha siteSlug, siteName e partnerName.' },
        { status: 400 },
      )
    }

    const existing = await PartnerProject.findOne({ siteSlug }).lean()
    console.log('[Projetos][POST] Existing com esse siteSlug:', existing)

    if (
      existing &&
      existing.ownerId &&
      existing.ownerId.toString() !== userId
    ) {
      console.log(
        '[Projetos][POST] Site já vinculado a outro usuário:',
        existing.ownerId?.toString(),
        '!=',
        userId,
      )
      return NextResponse.json(
        { error: 'Este site já está vinculado a outro usuário.' },
        { status: 403 },
      )
    }

    console.log('[Projetos][POST] Vou salvar/upsert com owner:', {
      ownerId: existing?.ownerId || user._id,
      ownerEmail: existing?.ownerEmail || user.email,
    })

    const doc = await PartnerProject.findOneAndUpdate(
      { siteSlug },
      {
        siteSlug,
        siteName,
        partnerName,
        domain: domain ?? existing?.domain ?? '',
        buckpayStoreId:
          buckpayStoreId !== undefined
            ? buckpayStoreId
            : existing?.buckpayStoreId ?? null,
        utmBase: utmBase !== undefined ? utmBase : existing?.utmBase ?? null,

        ownerId: existing?.ownerId || user._id,
        ownerEmail: existing?.ownerEmail || user.email,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean()

    console.log('[Projetos][POST] Doc salvo/upsertado:', {
      _id: doc?._id,
      siteSlug: doc?.siteSlug,
      ownerId: doc?.ownerId,
      ownerEmail: doc?.ownerEmail,
    })

    const projectResponse = {
      id: doc.siteSlug,
      siteSlug: doc.siteSlug,
      partnerName: doc.partnerName || '',
      siteName: doc.siteName || doc.siteSlug,
      domain: doc.domain || '',
      buckpayStoreId: doc.buckpayStoreId ?? null,
      utmBase: doc.utmBase ?? null,
      totalOrders: 0,
      totalGross: 0,
      totalNet: 0,
      myCommissionTotal: 0,
      status: 'no_sales' as ProjectStatus,
      lastOrderAt: null as string | null,
    }

    console.log(
      '[Projetos][POST] projectResponse retornado para o front:',
      projectResponse,
    )

    return NextResponse.json(projectResponse)
  } catch (err) {
    console.error('[Projetos] Erro ao criar projeto:', err)
    return NextResponse.json(
      { error: 'Erro interno ao criar projeto.' },
      { status: 500 },
    )
  }
}
