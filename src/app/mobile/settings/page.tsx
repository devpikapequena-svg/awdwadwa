// app/mobile/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Settings, LayoutDashboard, BarChart2 } from 'lucide-react'
import Link from 'next/link'

/* ============================ */
/*  LOADER FULLSCREEN BOLINHA   */
/* ============================ */

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="relative h-10 w-10">
        {/* círculo externo suave */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        {/* círculo traçado girando */}
        <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent border-dashed animate-spin" />
      </div>
    </div>
  )
}

/* ============================ */
/*  LOADER LOGIN EXPIRADO       */
/* ============================ */

function ExpiredRedirectSpinner() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/mobile/login')
    }, 3500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="relative h-10 w-10">
        {/* círculo externo suave */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        {/* círculo traçado girando */}
        <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent border-dashed animate-spin" />
      </div>
    </main>
  )
}

/* ============================ */
/*          TYPES               */
/* ============================ */

type UserType = {
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

  const [user, setUser] = useState<UserType | null>(null)
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
          subscription: null,
          statuses: next,
          enabled: true,
        }),
      })
    } catch (err) {
      console.error('Erro ao atualizar statuses de notificação', err)
    }
  }
  /* ========= GUARDS ========= */

  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black px-6 py-7 text-center">
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa é a interface pensada para celular. Acesse pelo smartphone ou
            use o painel normal no desktop.
          </p>
        </div>
      </main>
    )
  }

  // carregando user / checando se é mobile
  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  // sessão expirada → bolinha + redirect pra /mobile/login
  if (!user) {
    return <ExpiredRedirectSpinner />
  }

  // carregando prefs na primeira vez
  if (loadingPrefs) {
    return <FullscreenLoader />
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-black text-white">
        {/* HEADER IGUAL CLIMA DO DASHBOARD */}
        <section className="relative z-10 w-full px-6 pt-8 pb-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="mt-1 text-[22px] font-semibold">Configurações</h1>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5">
              <Settings className="h-4 w-4 text-white/70" />
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL */}
        <section className="relative z-10 flex-1 px-6 pb-24">
          <div className="space-y-3">
            {/* CARD NOTIFICAÇÕES */}
            <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3.5 ">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                    <Bell className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">
                      Notificações push
                    </span>
                    <span className="text-[11px] text-white/50">
                      Receba alertas quando entrar venda.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingPrefs}
                  onClick={() => handleToggleNotification(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition ${
                    notificationsEnabled
                      ? 'border-white bg-white'
                      : 'border-[#3a3a3a] bg-[#1f1f1f]'
                  } ${savingPrefs ? 'opacity-60' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {!notificationsEnabled && (
                <p className="mt-3 text-[11px] text-white/45">
                  Ative o botão acima para o app pedir permissão e registrar seu
                  dispositivo para receber as notificações de venda.
                </p>
              )}

              {notificationsEnabled && (
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <p className="text-[11px] text-white/55">
                      Enviar push quando a venda estiver com os status:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATUS_LABELS) as NotificationStatus[]).map(
                        (st) => {
                          const active = selectedStatuses.includes(st)
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => toggleStatus(st)}
                              className={`rounded-full px-3 py-1 text-[11px] transition border ${
                                active
                                  ? 'border-white bg-white text-black'
                                  : 'border-white/15 bg-black text-white/60'
                              }`}
                            >
                              {STATUS_LABELS[st]}
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/95 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around px-4 py-6 text-[11px]">
            <Link
              href="/mobile"
              className="flex flex-col items-center gap-1 text-white/60"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/mobile/comissoes"
              className="flex flex-col items-center gap-1 text-white/60"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Resumo</span>
            </Link>

            <Link
              href="/mobile/settings"
              className="flex flex-col items-center gap-1 text-white"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
