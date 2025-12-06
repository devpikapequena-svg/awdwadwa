// app/mobile/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  Settings,
  Smartphone,
  Home,
  Wallet2,
} from 'lucide-react'

/* ============================ */
/*  LOADER PREMIUM EM TELA CHEIA */
/* ============================ */

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]">
      <div className="relative h-12 w-12">
        {/* anel externo */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        {/* spinner */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        {/* glow suave */}
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
      </div>
    </div>
  )
}

/* ============================ */
/*          TYPES               */
/* ============================ */

type User = {
  id: string
  name: string
  email: string
}

type NotificationStatus = 'paid' | 'pending' | 'med'

type PrefsResponse = {
  enabled: boolean
  statuses: NotificationStatus[]
  hasSubscription: boolean
}

const STATUS_LABELS: Record<NotificationStatus, string> = {
  paid: 'Pagas',
  pending: 'Pendentes',
  med: 'Estornadas',
}

// helper pra VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function MobileSettingsPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedStatuses, setSelectedStatuses] =
    useState<NotificationStatus[]>(['paid'])
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
const [testingPush, setTestingPush] = useState(false)

  // detectar se é mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // buscar user
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
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  // carregar preferências de notificação
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        setLoadingPrefs(true)
        const res = await fetch('/api/notifications/subscribe', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setNotificationsEnabled(false)
          setSelectedStatuses(['paid'])
          return
        }

        const data: PrefsResponse = await res.json()
        setNotificationsEnabled(data.enabled)
        setSelectedStatuses(
          (data.statuses && data.statuses.length > 0
            ? data.statuses
            : ['paid']) as NotificationStatus[],
        )
      } catch (err) {
        console.error('Erro ao carregar prefs de notificação', err)
        setNotificationsEnabled(false)
        setSelectedStatuses(['paid'])
      } finally {
        setLoadingPrefs(false)
      }
    }

    loadPrefs()
  }, [])

  const handleToggleNotification = async (checked: boolean) => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta notificações push.')
      return
    }

    // DESATIVAR
    if (!checked) {
      setSavingPrefs(true)
      try {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        })
        setNotificationsEnabled(false)
        setSelectedStatuses(['paid'])
      } catch (err) {
        console.error('Erro ao desativar notificações', err)
        alert('Não foi possível desativar as notificações agora.')
      } finally {
        setSavingPrefs(false)
      }
      return
    }

    // ATIVAR: pedir permissão + criar subscription
    try {
      setSavingPrefs(true)

      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        alert('Você precisa permitir notificações para ativar.')
        setNotificationsEnabled(false)
        return
      }

      const reg = await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada')
        alert('Configuração de push não está completa no servidor.')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          statuses: selectedStatuses,
          enabled: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Erro no subscribe:', data)
        alert('Não foi possível ativar as notificações.')
        return
      }

      setNotificationsEnabled(true)
    } catch (err) {
      console.error('Erro ao ativar notificações', err)
      alert('Erro ao ativar notificações.')
    } finally {
      setSavingPrefs(false)
    }
  }

  const toggleStatus = async (status: NotificationStatus) => {
    if (!notificationsEnabled) return

    let next: NotificationStatus[]
    if (selectedStatuses.includes(status)) {
      // se só tiver 1 selecionado, não deixa ficar vazio
      if (selectedStatuses.length === 1) return
      next = selectedStatuses.filter((s) => s !== status)
    } else {
      next = [...selectedStatuses, status]
    }

    setSelectedStatuses(next)

    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: null, // só atualiza statuses
          statuses: next,
          enabled: true,
        }),
      })
    } catch (err) {
      console.error('Erro ao atualizar statuses de notificação', err)
    }
  }

    const handleTestPush = async () => {
    try {
      setTestingPush(true)
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(
          data?.message ||
            'Não foi possível enviar a notificação de teste. Verifique se o app está instalado e as notificações estão ativas.',
        )
        return
      }

      alert('Notificação de teste enviada. Confira no seu iPhone 📲')
    } catch (err) {
      console.error('Erro ao enviar push de teste', err)
      alert('Erro ao enviar notificação de teste.')
    } finally {
      setTestingPush(false)
    }
  }


  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa é a interface pensada para celular. Acesse pelo smartphone ou
            use o painel normal no desktop.
          </p>
        </div>
      </main>
    )
  }

  // 🔥 Loader premium no início
  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar seu painel.
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
      {/* HEADER MOBILE - mesmo estilo do de comissões, mas pra Config */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#171717] bg-gradient-to-r from-[#050505] via-[#070707] to-[#050505] px-4 pb-3 pt-[16px]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <Settings className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/50">
              {user.name?.split(' ')[0] || 'Parceiro(a)'}
            </span>
            <span className="text-sm font-semibold leading-tight">
              Configurações
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/mobile')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-white/70" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO SCROLLÁVEL */}
      <section className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-6">
          {/* CARD STATUS DO APP */}
          <div className="relative overflow-hidden rounded-3xl border border-[#191919] bg-[#070707] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/5 blur-xl" />
            <div className="absolute -left-8 bottom-0 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
                <Smartphone className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/55">
                  App instalado no iPhone
                </span>
                <span className="text-xs text-white/80">
                  Se você adicionou na tela de início, pode receber push real
                  das vendas.
                </span>
              </div>
            </div>
          </div>

          {/* CARD NOTIFICAÇÕES */}
          <div className="rounded-3xl border border-[#151515] bg-[#070707] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <Bell className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">
                    Notificações push
                  </span>
                  <span className="text-[11px] text-white/50">
                    Receba alertas quando entrar venda.
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={loadingPrefs || savingPrefs}
                onClick={() =>
                  handleToggleNotification(!notificationsEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition ${
                  notificationsEnabled
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-white/15 bg-black/60'
                } ${savingPrefs ? 'opacity-60' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {loadingPrefs ? (
              <div className="mt-3 h-9 animate-pulse rounded-2xl bg-white/5" />
            ) : (
              <>
                {!notificationsEnabled && (
                  <p className="mt-3 text-[11px] text-white/45">
                    Ative acima para o app pedir permissão de notificação no
                    seu iPhone e registrar seu dispositivo.
                  </p>
                )}

{notificationsEnabled && (
  <div className="mt-3 space-y-3">
    <div className="space-y-2">
      <p className="text-[11px] text-white/55">
        Enviar push quando a venda estiver com os status:
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABELS) as NotificationStatus[]).map((st) => {
          const active = selectedStatuses.includes(st)
          return (
            <button
              key={st}
              type="button"
              onClick={() => toggleStatus(st)}
              className={`rounded-full px-3 py-1 text-[11px] transition border ${
                active
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                  : 'border-white/10 bg-black/40 text-white/55'
              }`}
            >
              {STATUS_LABELS[st]}
            </button>
          )
        })}
      </div>
    </div>

    <button
      type="button"
      onClick={handleTestPush}
      disabled={testingPush}
      className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
    >
      {testingPush ? 'Enviando...' : 'Enviar notificação de teste'}
    </button>

    <p className="text-[10px] text-white/40">
      Dica: marque só o que importa pra você (por exemplo, apenas vendas
      pagas). O backend usa essas preferências quando for disparar os push.
    </p>
  </div>
)}

              </>
            )}
          </div>
        </div>
      </section>

      {/* NAVBAR INFERIOR */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 
                bg-black/10 backdrop-blur-2xl 
                shadow-[0_-12px_40px_rgba(0,0,0,0.85)] 
                h-[80px] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-2 translate-y-[4px]">
          {/* PAINEL */}
          <button
            onClick={() => router.push('/mobile')}
            className="flex flex-1 items-center justify-center"
          >
            <div
              className={`flex items-center transition-all ${
                pathname === '/mobile'
                  ? 'bg-white h-8 px-3 gap-2 text-black rounded-xl shadow-lg'
                  : 'bg-transparent h-10 px-0 gap-0 text-white/70 rounded-none'
              }`}
            >
              <Home className={pathname === '/mobile' ? 'h-4 w-4' : 'h-6 w-6'} />
              {pathname === '/mobile' && (
                <span className="text-xs font-semibold">Painel</span>
              )}
            </div>
          </button>

          {/* VENDAS */}
          <button
            onClick={() => router.push('/mobile/comissoes')}
            className="flex flex-1 items-center justify-center"
          >
            <div
              className={`flex items-center transition-all ${
                pathname === '/mobile/comissoes'
                  ? 'bg-white h-8 px-3 gap-2 text-black rounded-xl shadow-lg'
                  : 'bg-transparent h-10 px-0 gap-0 text-white/70 rounded-none'
              }`}
            >
              <Wallet2
                className={
                  pathname === '/mobile/comissoes' ? 'h-4 w-4' : 'h-6 w-6'
                }
              />
              {pathname === '/mobile/comissoes' && (
                <span className="text-xs font-semibold">Vendas</span>
              )}
            </div>
          </button>

          {/* CONFIG */}
          <button
            onClick={() => router.push('/mobile/settings')}
            className="flex flex-1 items-center justify-center"
          >
            <div
              className={`flex items-center transition-all ${
                pathname === '/mobile/settings'
                  ? 'bg-white h-8 px-3 gap-2 text-black rounded-xl shadow-lg'
                  : 'bg-transparent h-10 px-0 gap-0 text-white/70 rounded-none'
              }`}
            >
              <Settings
                className={
                  pathname === '/mobile/settings' ? 'h-4 w-4' : 'h-6 w-6'
                }
              />
              {pathname === '/mobile/settings' && (
                <span className="text-xs font-semibold">Config</span>
              )}
            </div>
          </button>
        </div>
      </nav>
    </main>
  )
}
