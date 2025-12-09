'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Smartphone } from 'lucide-react'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: string
}

// Loader igual vibe do /mobile
function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent border-dashed animate-spin" />
      </div>
    </main>
  )
}

export default function MobileLoginPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // mobile guard
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // se já estiver logado, manda pra /mobile
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data)
          router.replace('/mobile')
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Erro ao checar sessão mobile', err)
        setUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Não foi possível entrar. Tente novamente.')
        return
      }

      router.replace('/mobile')
    } catch (err) {
      console.error('Erro ao logar', err)
      setError('Erro interno ao fazer login. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  // GUARDS

  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black px-6 py-7 text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
            <Smartphone className="h-4 w-4 text-white/70" />
          </div>
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa área foi desenhada para uso em celular. Acesse pelo smartphone
            ou utilize o painel principal no desktop.
          </p>
        </div>
      </main>
    )
  }

  if (checkingAuth || isMobile === null) {
    return <FullscreenLoader />
  }

  // ===== TELA DE LOGIN MOBILE =====
  return (
    <>
      <main className="relative flex min-h-screen flex-col bg-black text-white">
        {/* fundo suave no topo, combinando com o /mobile */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />

        <div className="relative z-10 flex min-h-screen flex-col px-6 pb-8 pt-10">
          {/* centraliza header + card no meio da tela */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            {/* topo: título + sutil descrição */}
            <header className="flex flex-col items-center text-center">
              {/* LOGO (logo.png no lugar do EQP) */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <h1 className="text-[22px] font-semibold leading-none">
                Entrar no painel mobile
              </h1>
              <p className="mt-2 max-w-xs text-[11px] text-white/55">
                Use o mesmo e-mail e senha que você já utiliza no painel
                principal para acessar o resumo rápido no celular.
              </p>
            </header>

            {/* Card do formulário */}
<section className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/80 px-5 py-6 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* E-MAIL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/55">
                    E-mail de acesso
                  </label>
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="exemplo@gmail.com"
  className="h-10 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-[16px] text-white/85 placeholder:text-white/40 outline-none focus:border-white/35 focus:ring-0"
/>

                </div>

                {/* SENHA */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/55">Senha</label>
                  <div className="relative">
<input
  type={showPassword ? 'text' : 'password'}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Digite sua senha"
  className="h-10 w-full rounded-lg border border-white/10 bg-[#050505] px-3 pr-9 text-[16px] text-white/85 placeholder:text-white/40 outline-none focus:border-white/35 focus:ring-0"
/>


                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-1 flex w-8 items-center justify-center rounded-md text-white/50 hover:bg-white/5"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERRO */}
                {error && (
                  <p className="pt-1 text-[11px] text-red-400/85">
                    {error}
                  </p>
                )}

                {/* BTN LOGIN */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[12px] font-medium text-black hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-black/40 border-t-transparent" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Rodapé mini info */}
              <div className="mt-4 border-t border-white/5 pt-3 text-center text-[10px] text-white/35">
                Esta é a versão mobile de acompanhamento rápido do seu painel.
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* animações reaproveitadas se quiser popovers depois */}
      <style jsx>{`
        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: translateY(-4px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes scaleOut {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-4px) scale(0.96);
          }
        }

        .animate-scaleIn {
          animation: scaleIn 0.16s ease-out forwards;
        }

        .animate-scaleOut {
          animation: scaleOut 0.16s ease-in forwards;
        }
      `}</style>
    </>
  )
}
