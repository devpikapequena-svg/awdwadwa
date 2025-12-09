'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeaderAfiliados from '@/components/HeaderAfiliados'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Não foi possível fazer login.')
        return
      }

      // login OK → cookie já foi setado pela API
      router.push('/dashboard') // redireciona para o dashboard/inicial
    } catch (err) {
      console.error(err)
      setError('Erro ao comunicar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#070707] text-white overflow-hidden">
      {/* HEADER FIXO IGUAL DASHBOARD */}
      <div className="relative z-20">
        <HeaderAfiliados />
      </div>

      {/* GLOW DE FUNDO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0">
        <div
          className="h-[280px]
          bg-[radial-gradient(circle_at_top,_rgba(158,158,158,0.25),_rgba(158,158,158,0.10)_5%,_transparent_90%)]
          blur-[108px]"
        />
      </div>

      {/* CONTEÚDO */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 pb-16 pt-28 md:px-6 md:pt-36">
        <div className="w-full max-w-md">
          {/* CARD */}
          <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.02] shadow-[0_34px_120px_rgba(0,0,0,0.9)]">
            <div className="px-6 py-8 md:px-8 md:py-10">
              {/* Badge */}
              <div className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Acesso ao painel
              </div>

              {/* Título */}
              <h1 className="mt-5 text-[24px] md:text-[26px] font-semibold leading-tight">
                Entrar no{' '}
                <span className="text-white/80">EQP Dashboard</span>
              </h1>

              <p className="mt-3 text-xs text-white/55">
                Use o e-mail e a senha cadastrados para visualizar vendas, recebíveis,
                comissões e métricas em tempo real.
              </p>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* E-MAIL */}
                <div>
                  <label className="text-xs font-medium text-white/70">
                    E-mail
                  </label>
                  <div className="mt-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 focus-within:border-white/40">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* SENHA */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/70">
                      Senha
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-white/40 hover:text-white/70 transition"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="mt-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 focus-within:border-white/40">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* ERRO */}
                {error && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-[11px] text-red-300">
                    {error}
                  </div>
                )}

                {/* BOTÃO */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full bg-white text-[13px] font-medium text-black shadow-[0_18px_45px_rgba(0,0,0,0.75)] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Entrando...' : 'Entrar no painel'}
                </button>
              </form>

              {/* RODAPÉ DO CARD */}
              <div className="mt-6 border-t border-white/5 pt-4 text-[11px] text-white/40">
                <p>
                  Precisa de acesso?{' '}
                  <Link
                    href="#"
                    className="text-white/70 underline-offset-2 hover:underline"
                  >
                    Fale com o administrador.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}