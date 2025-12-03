// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Preencha e-mail e senha.' },
        { status: 400 },
      )
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 },
      )
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 },
      )
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    const res = NextResponse.json(
      {
        message: 'Login efetuado com sucesso.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan || 'none', // ⬅️ já devolve o plano
        },
      },
      { status: 200 },
    )

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (err) {
    console.error('LOGIN ERROR', err)
    return NextResponse.json(
      { error: 'Erro interno ao fazer login.' },
      { status: 500 },
    )
  }
}
