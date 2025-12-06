'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Wallet2,
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Settings,
  Home,
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

type PartnerPaymentRow = {
  id: string
  amount: number
  note: string
  createdAt: string
}

type PartnerRow = {
  partnerId: string
  partnerName: string
  siteSlug: string
  siteName: string
  totalGross: number
  totalNet: number
  myCommission: number
  totalPaid: number
  balance: number
  payments: PartnerPaymentRow[]
}

type Period = 'all' | 'today' | 'yesterday' | 'last7' | 'last30'

/* ============================ */
/*  PÁGINA PRINCIPAL COMISSÕES  */
/* ============================ */

export default function MobileComissoesPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loadingPartners, setLoadingPartners] = useState(true)

  const [period, setPeriod] = useState<Period>('today')

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  const [historyPartner, setHistoryPartner] = useState<PartnerRow | null>(null)

  /* ============================ */
  /*        HELPERS               */
  /* ============================ */

  const formatCurrency = (v: number | null | undefined) =>
    (v ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /* ============================ */
  /*     DETECTAR MOBILE          */
  /* ============================ */

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ============================ */
  /*     FETCH USER               */
  /* ============================ */

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        setUser(null)
      } else {
        setUser(await res.json())
      }
    } catch {
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  const fetchPartners = async () => {
    setLoadingPartners(true)
    try {
      const params = new URLSearchParams()
      if (period !== 'today') params.set('period', period)

      const res = await fetch(`/api/notas?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        setPartners([])
      } else {
        const data = await res.json()
        setPartners(Array.isArray(data.partners) ? data.partners : [])
      }
    } catch {
      setPartners([])
    } finally {
      setLoadingPartners(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPartners()
  }, [user, period])

  /* ============================ */
  /*  LOADING INICIAL COMPLETO    */
  /* ============================ */

  if (loadingUser || isMobile === null) return <FullscreenLoader />

  /* ============================ */
  /*    SEM USUÁRIO LOGADO        */
  /* ============================ */

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar.
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

  const periodLabelMap: Record<Period, string> = {
    all: 'Tudo que já foi gerado',
    today: 'Hoje',
    yesterday: 'Ontem',
    last7: 'Últimos 7 dias',
    last30: 'Últimos 30 dias',
  }

  const totalCommission = partners.reduce((a, p) => a + p.myCommission, 0)
  const totalPaid = partners.reduce((a, p) => a + p.totalPaid, 0)
  const totalBalance = partners.reduce((a, p) => a + Math.max(p.balance, 0), 0)

  /* ============================ */
  /*           HTML               */
  /* ============================ */

  return (
    <main className="flex min-h-screen flex-col bg-[#050505] text-white">

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#171717] bg-gradient-to-r from-[#050505] via-[#070707] to-[#050505] px-4 pb-3 pt-[16px]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <Wallet2 className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/50">
              {user.name?.split(' ')[0]}
            </span>
            <span className="text-sm font-semibold">Suas comissões</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Bell className="h-3.5 w-3.5 text-white/70" />
          </button>
          <button
            onClick={() => router.push('/mobile/settings')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40"
          >
            <Settings className="h-3.5 w-3.5 text-white/70" />
          </button>
        </div>
      </header>

      {/* SCROLL CONTENT */}
      <section className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-6">

          {/* CARD PRINCIPAL */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-black/15 blur-xl" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-emerald-50/80">
                  Comissão líquida (vendas – ADS)
                </span>
                <span className="text-2xl font-semibold tracking-tight text-emerald-950">
                  {formatCurrency(totalCommission)}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-900/20 px-2 py-0.5 text-[10px] text-emerald-950/100">
                  {periodLabelMap[period]}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-emerald-50/80">Saldo</span>
                <span className="text-lg font-semibold text-emerald-950">
                  {formatCurrency(totalBalance)}
                </span>
                <span className="text-[10px] text-emerald-50/70">
                  Pago: <strong>{formatCurrency(totalPaid)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* VISÃO GERAL */}
          <div className="flex flex-col gap-3 rounded-3xl border border-[#151515] bg-[#070707] p-3">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-300" />
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-white/45">
                    Visão geral
                  </span>
                  <span className="text-xs font-semibold">
                    {periodLabelMap[period]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/45">Período</span>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-1 py-0.5 text-[10px]">

                  <PeriodChip
                    label="Hoje"
                    active={period === 'today'}
                    onClick={() => setPeriod('today')}
                  />
                  <PeriodChip
                    label="Ontem"
                    active={period === 'yesterday'}
                    onClick={() => setPeriod('yesterday')}
                  />
                  <PeriodChip
                    label="7d"
                    active={period === 'last7'}
                    onClick={() => setPeriod('last7')}
                  />
                  <PeriodChip
                    label="30d"
                    active={period === 'last30'}
                    onClick={() => setPeriod('last30')}
                  />
                  <PeriodChip
                    label="Tudo"
                    active={period === 'all'}
                    onClick={() => setPeriod('all')}
                  />

                </div>
              </div>
            </div>

            {/* MINI CARDS */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <ResumoMiniCard
                icon={Wallet2}
                label="Comissão"
                value={formatCurrency(totalCommission)}
              />
              <ResumoMiniCard
                icon={ArrowDownCircle}
                label="Já pago"
                value={formatCurrency(totalPaid)}
              />
              <ResumoMiniCard
                icon={ArrowUpCircle}
                label="Saldo"
                value={formatCurrency(totalBalance)}
                accent
              />
            </div>
          </div>

          {/* LISTA DE PARCEIROS */}
          <div className="mt-1 rounded-3xl border border-[#191919] bg-[#070707] p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                <Wallet2 className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <p className="text-xs font-semibold">Saldo por parceiro</p>
            </div>

            {loadingPartners ? (
              /* ========== LOADER PREMIUM INTERNO ========== */
              <div className="flex items-center justify-center py-8">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-lg animate-pulse" />
                </div>
              </div>
            ) : partners.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl bg-white/3 px-3 py-6 text-center">
                <p className="text-[11px] text-white/55">
                  Nenhum parceiro encontrado.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {partners.map((p) => {
                  const balanceClass =
                    p.balance > 0
                      ? 'text-amber-300'
                      : p.balance < 0
                      ? 'text-sky-300'
                      : 'text-emerald-300'

                  return (
                    <button
                      key={p.partnerId}
                      onClick={() => setHistoryPartner(p)}
                      className="flex items-center justify-between rounded-2xl bg-white/3 px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] uppercase">
                          {p.partnerName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-white/85">
                            {p.partnerName}
                          </span>
                          <span className="text-[10px] text-white/45">
                            {p.siteName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 text-[10px]">
                        <span className="text-white/60">
                          Comissão:{' '}
                          <strong className="text-white/90">
                            {formatCurrency(p.myCommission)}
                          </strong>
                        </span>
                        <span className="text-white/50">
                          Pago:{' '}
                          <strong className="text-white/80">
                            {formatCurrency(p.totalPaid)}
                          </strong>
                        </span>
                        <span className={balanceClass}>
                          Saldo: {formatCurrency(p.balance)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </section>

{/* NAVBAR INFERIOR */}
<nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 
                bg-black/10 backdrop-blur-2xl 
                shadow-[0_-12px_40px_rgba(0,0,0,0.85)] 
                h-[80px] pb-[env(safe-area-inset-bottom)]">

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

      {/* MODAL DE HISTÓRICO */}
      {historyPartner && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border border-[#2a2a2a] border-b-0 bg-gradient-to-br from-[#070707] via-[#050505] to-[#020202] px-5 py-5 shadow-[0_-24px_80px_rgba(0,0,0,0.9)]">
            
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] text-white/45">Histórico de pagamentos</p>
                <h2 className="mt-0.5 text-sm font-semibold text-white">{historyPartner.partnerName}</h2>
                <p className="text-[10px] text-white/45">{historyPartner.siteName}</p>
              </div>

              <button
                onClick={() => setHistoryPartner(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
              <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                <p className="text-white/45">Comissão gerada</p>
                <p className="mt-1 text-[11px] font-semibold text-white">{formatCurrency(historyPartner.myCommission)}</p>
              </div>
              <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                <p className="text-white/45">Já pago</p>
                <p className="mt-1 text-[11px] font-semibold text-white">{formatCurrency(historyPartner.totalPaid)}</p>
              </div>
              <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                <p className="text-white/45">Saldo atual</p>
                <p className="mt-1 text-[11px] font-semibold text-amber-300">{formatCurrency(historyPartner.balance)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] text-white/55">Pagamentos registrados</p>

              {historyPartner.payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-4 py-4 text-[11px] text-white/60">
                  Nenhum pagamento lançado ainda.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-[#262626] bg-[#080808]">
                  <ul className="divide-y divide-[#262626]/80">
                    {historyPartner.payments.map((pg) => (
                      <li key={pg.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-white">{formatCurrency(pg.amount)}</span>
                          {pg.note && <span className="text-[10px] text-white/55">{pg.note}</span>}
                        </div>
                        <span className="text-[10px] text-white/40 whitespace-nowrap">
                          {formatDateTime(pg.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setHistoryPartner(null)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#262626] bg-[#101010] px-4 py-2.5 text-[11px] text-white/80 hover:bg-white/5 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </main>
  )
}

/* ============================ */
/*   COMPONENTES INTERNOS       */
/* ============================ */

function ResumoMiniCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white/3 px-2.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/30 border border-white/5">
        <Icon className="h-3.5 w-3.5 text-white/70" />
      </div>
      <div className="flex flex-col">
        <p className="text-[10px] text-white/55">{label}</p>
        <p className={`text-[11px] font-semibold leading-tight ${accent ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}

function PeriodChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-0.5 ${
        active ? 'bg-white text-black font-semibold' : 'text-white/60'
      }`}
    >
      {label}
    </button>
  )
}
