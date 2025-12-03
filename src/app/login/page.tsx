'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Chrome, Github, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

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
        setError(data.error || 'Erro ao fazer login.')
        return
      }

      // cookie httpOnly já está setado na API
      // aqui você só redireciona pro painel
      router.push('/dashboard') // troca pro caminho do teu painel
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#05070d] text-white flex">
      {/* LADO ESQUERDO - HERO */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 relative overflow-hidden">
        {/* glow geral */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12),_transparent_70%)]" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,180,120,0.25),_transparent_60%)]" />

        {/* ESTRELAS DE FUNDO */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
          <div className="absolute top-16 left-24 h-1 w-1 rounded-full bg-white/80" />
          <div className="absolute top-24 left-1/2 h-[2px] w-[2px] rounded-full bg-white/70" />
          <div className="absolute top-10 right-32 h-[2px] w-[2px] rounded-full bg-white/80" />
          <div className="absolute top-32 right-20 h-[1.5px] w-[1.5px] rounded-full bg-white/60" />
          <div className="absolute top-40 left-10 h-[1.5px] w-[1.5px] rounded-full bg-white/60" />
          <div className="absolute top-48 left-40 h-1 w-1 rounded-full bg-white/75" />
          <div className="absolute top-14 left-[60%] h-[1.5px] w-[1.5px] rounded-full bg-white/65" />
          <div className="absolute top-28 left-[70%] h-[1.5px] w-[1.5px] rounded-full bg-white/55" />
        </div>

        <h1 className="text-4xl font-semibold mb-4 z-10">
         Acesse sua central de <span className="text-emerald-400">operações</span>
        </h1>

        <p className="text-white/60 text-center max-w-xs text-sm z-10">
       Gerencie filas, automações e disparos com precisão total.
        </p>

        {/* GLOBO TECNOLÓGICO 3D */}
        <div className="relative mt-16 w-[33rem] aspect-square z-10">
          {/* brilho atrás */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.18),_transparent_70%)] blur-2xl" />

          {/* GLOBO */}
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full opacity-90"
            fill="none"
            stroke="#4ef2d8"
            strokeWidth="1.2"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <ellipse
                key={i}
                cx="300"
                cy="300"
                rx={260 - i * 10}
                ry="260"
                className="origin-center animate-[rotateGlobe_12s_linear_infinite]"
                style={{ transform: `rotate(${i * 12}deg)` }}
                strokeOpacity="0.35"
              />
            ))}
          </svg>

          {/* Sombra embaixo */}
          <div className="absolute bottom-[-5rem] left-1/2 -translate-x-1/2 h-44 w-[160%] bg-black/90 blur-3xl rounded-full" />
        </div>

        <style jsx global>{`
          @keyframes rotateGlobe {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* LADO DIREITO - LOGIN CENTRALIZADO */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-6 md:px-10 bg-[#05070d]">
        <div className="w-full max-w-md mx-auto">
          {/* mini logo + título */}
          <div className="mb-6 text-center flex flex-col items-center">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5">
              <span className="text-sm font-bold tracking-[0.3em] uppercase text-white/70">
                A
              </span>
            </div>

            <h2 className="text-3xl font-semibold mt-4">Bem-vindo de volta</h2>

            <p className="mt-4 text-sm text-white/50">
              Faça login ou{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
                crie sua conta
              </Link>.
            </p>
          </div>

          {/* botões sociais (mock) */}
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition">
              <Chrome className="h-4 w-4" />
              Continuar com Google
            </button>

            <button className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition">
              <Github className="h-4 w-4" />
              Continuar com GitHub
            </button>
          </div>

          {/* separador */}
          <div className="my-8 flex items-center gap-4 text-xs text-white/35">
            <div className="h-px flex-1 bg-white/10" />
            <span>/</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* form login */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="rounded-2xl bg-white/5 border border-white/15 overflow-hidden">
              {/* EMAIL */}
              <div className="px-4 h-14 flex items-center">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/70 outline-none border-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="h-px bg-white/10" />

              {/* PASSWORD */}
              <div className="px-4 h-14 flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none border-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="ml-2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center bg-white py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition rounded-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {error && (
              <p className="mt-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
