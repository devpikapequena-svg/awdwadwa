'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react'

export default function MobileLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Credenciais inválidas.')
        return
      }

      router.push('/mobile')
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white px-5">
      <div className="w-full max-w-sm rounded-3xl border border-[#191919] bg-gradient-to-b from-[#0b0b0b] via-[#050505] to-[#050505] px-6 py-7 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">

        {/* HEADER DO CARD */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <LogIn className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/45">Acesso ao painel</span>
            <span className="text-sm font-semibold leading-tight">Entre na sua conta</span>
          </div>
        </div>

        {/* FORM */}
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>

          {/* INPUT EMAIL */}
          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
            <Mail className="h-4 w-4 text-white/40" />
            <input
              type="email"
              placeholder="Seu e-mail"
              className="w-full bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {/* INPUT SENHA */}
          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
            <Lock className="h-4 w-4 text-white/40" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/50"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* BOTÃO LOGIN */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-white py-3 text-[13px] font-semibold text-black shadow-lg shadow-emerald-500/10 active:scale-[0.97] transition disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && (
            <p className="mt-1 text-center text-[12px] text-red-400">{error}</p>
          )}
        </form>

        {/* RODAPÉ */}
        <p className="mt-5 text-center text-[11px] text-white/40">
          Esqueceu sua senha?{" "}
          <span className="text-emerald-300">Contate o suporte</span>.
        </p>
      </div>
    </main>
  )
}
