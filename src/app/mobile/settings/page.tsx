// app/mobile/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  LogOut,
  Settings,
  Smartphone,
  Home,          // ⬅️ adiciona aqui
  ShoppingBag,   // ⬅️ e aqui
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

export default function MobileSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) {
          setUser(null)
        } else {
          const data = await res.json()
          setUser(data)
        }
      } catch (err) {
        console.error('Erro ao buscar usuário', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa tela de configurações é feita para uso no celular. Acesse
            pelo smartphone.
          </p>
        </div>
      </main>
    )
  }

  if (loading || isMobile === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/70" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar as configurações.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
          >
            Ir para login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#050505] text-white">
      {/* HEADER */}
      <header className="relative flex items-center gap-3 border-b border-[#171717] bg-gradient-to-r from-[#050505] via-[#070707] to-[#050505] px-4 pb-3 pt-5">
        <button
          onClick={() => router.push('/mobile')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40"
        >
          <ArrowLeft className="h-4 w-4 text-white/80" />
        </button>

        <div className="flex flex-1 flex-col">
          <span className="text-[11px] text-white/50">Configurações</span>
          <span className="text-sm font-semibold leading-tight">
            {user.name || user.email}
          </span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/40">
          <Settings className="h-4 w-4 text-emerald-300" />
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="flex-1 overflow-y-auto pb-20">
        <div className="space-y-5 px-4 pt-4">
          {/* INFO DA CONTA */}
          <div className="rounded-2xl border border-[#1e1e1e] bg-[#080808] p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                <span className="text-sm font-semibold">
                  {user.name ? user.name[0]?.toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {user.name || 'Usuário'}
                </span>
                <span className="text-[11px] text-white/55">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE NOTIFICAÇÕES / APP */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-white/70">
              App & notificações
            </span>

            <div className="space-y-2">
              <button className="flex w-full items-center justify-between rounded-2xl border border-[#1e1e1e] bg-[#080808] px-3.5 py-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5">
                    <Bell className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium">
                      Notificações de vendas
                    </span>
                    <span className="text-[10px] text-white/55">
                      Ative para receber alertas de vendas aprovadas e
                      pendentes.
                    </span>
                  </div>
                </div>
              </button>

              <div className="rounded-2xl border border-dashed border-[#252525] bg-[#050505] px-3.5 py-3 text-[10px] text-white/60">
                Dica: adicione esse painel à tela inicial do seu celular
                para usar como se fosse um app.
              </div>

              <div className="rounded-2xl border border-[#1e1e1e] bg-[#080808] px-3.5 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5">
                  <Smartphone className="h-4 w-4 text-white/80" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium">
                    Adicionar à tela inicial
                  </span>
                  <span className="text-[10px] text-white/55">
                    No navegador do celular, abra o menu e escolha &quot;Adicionar à
                    tela inicial&quot; para fixar seu dashboard.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SAIR DA CONTA */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-white/70">
              Conta
            </span>

            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                  })
                } catch (e) {
                  console.error(e)
                } finally {
                  router.push('/login')
                }
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/20">
                  <LogOut className="h-4 w-4 text-red-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-red-200">
                    Sair da conta
                  </span>
                  <span className="text-[10px] text-red-200/70">
                    Desconectar e voltar para a tela de login.
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* BOTTOM NAV IGUAL AO DASHBOARD */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#191919] bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2.5">
          <button
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px]"
            onClick={() => router.push('/mobile')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#101010]">
              <Home className="h-4 w-4 text-white/80" />
            </div>
            <span className="text-white/60">Dashboard</span>
          </button>

          <button
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px]"
            onClick={() => router.push('/vendas')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#101010]">
              <ShoppingBag className="h-4 w-4 text-white/80" />
            </div>
            <span className="text-white/60">Vendas desktop</span>
          </button>

          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-emerald-500/20">
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-white/90 font-medium">
              Configurações
            </span>
          </button>
        </div>
      </nav>
    </main>
  )
}
