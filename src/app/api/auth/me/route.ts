// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

const emptyAffiliates = {
  aliexpress: { appKey: '', secret: '', trackingId: '' },
  amazon: { associateId: '', accessKey: '', secretKey: '' },
  awin: { affiliateId: '', apiToken: '' },
  shopee: { affiliateId: '', apiPassword: '' },
  magalu: { storeName: '' },
  natura: { digitalSpaceUrl: '' },
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      )
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(decoded.id).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    const plan = user.plan

    return NextResponse.json(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan,
        affiliates: user.affiliates ?? emptyAffiliates,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('ME ERROR', err)
    return NextResponse.json(
      { error: 'Erro interno ao buscar usuário.' },
      { status: 500 }
    )
  }
}
