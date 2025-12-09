// src/app/mobile/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Eye,
  EyeOff,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  BarChart2,
  User,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
} from 'recharts'

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

// ====== TYPES ======
type DailyPoint = {
  date: string
  totalGross: number
  totalNet: number
  myCommission: number
  orders: number
}

type PartnerSummary = {
  id: string
  name: string
  siteName: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommission: number
}

type LastOrder = {
  id: string
  siteName: string
  buyerName?: string
  amount: number
  profit: number
  myCommission: number
  status: 'paid' | 'pending' | 'refunded'
  createdAt: string
  source?: string | null
}

type DashboardSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
  dailySeries: DailyPoint[]
  partners: PartnerSummary[]
  lastOrders: LastOrder[]
}

type Currency = 'BRL' | 'USD'
type Period = 'today' | 'yesterday' | 'last7' | 'last30'

type UserType = {
  id: string
  name: string
  email: string
}

// ====== HELPERS ======
const currencyFormatters = {
  BRL: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }),
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }),
} as const

// taxa fixa só pra exibição (BRL -> USD)
const EXCHANGE_RATE_BRL_TO_USD = 5.2

function formatCurrency(
  value: number | null | undefined,
  currency: Currency = 'BRL',
) {
  if (value == null) {
    return currency === 'BRL' ? 'R$ 0,00' : '$0.00'
  }

  let amount = value
  if (currency === 'USD') {
    amount = value / EXCHANGE_RATE_BRL_TO_USD
  }

  return currencyFormatters[currency].format(amount)
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // YYYY-MM-DD em timezone local
}


function addDays(base: Date, days: number) {
  const dd = new Date(base)
  dd.setDate(dd.getDate() + days)
  return dd
}

// Tooltip simples (agora recebe formatter + flag pra esconder)
function WalletTooltip({ active, payload, showValue, formatter }: any) {
  if (!active || !payload || !payload.length || !showValue) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-[11px] text-white/80">
      <p className="mb-1 text-white/60">{p.payload.label}</p>
      <p className="font-medium">
        Faturamento líquido: {formatter(p.value)}
      </p>
    </div>
  )
}

export default function MobileWalletPage() {
  const router = useRouter()

  // ===== AUTH / MOBILE GUARD =====
  const [user, setUser] = useState<UserType | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

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

  // ===== DATA =====
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toYMD(new Date()),
  )
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [yesterdaySummary, setYesterdaySummary] =
    useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)

  // ===== EXIBIÇÃO / CONFIG =====
  const [currency, setCurrency] = useState<Currency>('BRL')
  const [showBalance, setShowBalance] = useState(true)
  const [period, setPeriod] = useState<Period>('today')

  const formatAmount = (value: number | null | undefined) =>
    formatCurrency(value, currency)

  const formatAmountNoSpace = (value: number | null | undefined) =>
    formatAmount(value).replace(/\s(?=\d)/, '') // tira espaço antes do número

  // ===== SETTINGS POPOVER =====
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsClosing, setSettingsClosing] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  // label bonitinho da data
  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDate])

  const isSelectedToday = useMemo(() => {
    const today = toYMD(new Date())
    return today === selectedDate
  }, [selectedDate])

  // período para mostrar embaixo do valor
  const dateChipText = useMemo(() => {
    switch (period) {
      case 'today':
        return `Hoje • ${selectedDateLabel}`
      case 'yesterday':
        return `Ontem • ${selectedDateLabel}`
      case 'last7':
        return 'Últimos 7 dias'
      case 'last30':
        return 'Últimos 30 dias'
      default:
        return selectedDateLabel
    }
  }, [period, selectedDateLabel])

  // fechar settings clicando fora
  useEffect(() => {
    if (!settingsOpen) return

    function handleClickOutside(ev: MouseEvent) {
      if (!settingsRef.current) return
      if (!settingsRef.current.contains(ev.target as Node)) {
        setSettingsClosing(true)
        setTimeout(() => setSettingsOpen(false), 160)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  // ===== CARREGA DASHBOARD =====
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        if (period === 'today') {
          // hoje + ontem pra comparação intradiária
          const baseDate = new Date(selectedDate + 'T12:00:00')
          const prevDate = addDays(baseDate, -1)

          const [resCurrent, resPrev] = await Promise.all([
            fetch(
              `/api/dashboard/summary?period=today&referenceDate=${selectedDate}`,
            ),
            fetch(
              `/api/dashboard/summary?period=today&referenceDate=${toYMD(
                prevDate,
              )}`,
            ),
          ])

          if (resCurrent.ok) {
            const data: DashboardSummary = await resCurrent.json()
            setSummary(data)
          } else {
            setSummary(null)
          }

          if (resPrev.ok) {
            const dataPrev: DashboardSummary = await resPrev.json()
            setYesterdaySummary(dataPrev)
          } else {
            setYesterdaySummary(null)
          }
        } else {
          // outros períodos: só 1 chamada
          const resCurrent = await fetch(
            `/api/dashboard/summary?period=${period}&referenceDate=${selectedDate}`,
          )

          if (resCurrent.ok) {
            const data: DashboardSummary = await resCurrent.json()
            setSummary(data)
          } else {
            setSummary(null)
          }

          setYesterdaySummary(null)
        }
      } catch (e) {
        console.error('Erro ao carregar dashboard mobile', e)
        setSummary(null)
        setYesterdaySummary(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate, period])

  const chartData = useMemo(() => {
    if (!summary) {
      const empty = []
      for (let h = 0; h < 24; h++) {
        empty.push({ label: `${String(h).padStart(2, '0')}h`, totalNet: 0 })
      }
      return empty
    }

    // soma por hora
    const byHour = new Map<number, number>()
    summary.dailySeries.forEach((p) => {
      const d = new Date(p.date)
      const h = d.getHours()
      const prev = byHour.get(h) ?? 0
      byHour.set(h, prev + p.totalNet)
    })

    const todayStr = toYMD(new Date())
    const isTodaySelected = period === 'today' && selectedDate === todayStr

    // ===== NÃO É HOJE → 24h normal =====
    if (!isTodaySelected) {
      const result: { label: string; totalNet: number }[] = []
      for (let h = 0; h < 24; h++) {
        result.push({
          label: `${String(h).padStart(2, '0')}h`,
          totalNet: byHour.get(h) ?? 0,
        })
      }
      return result
    }

    // ===== É HOJE =====
    const now = new Date()
    let currentHour = now.getHours() // ex: 15

    // garante pelo menos 1h de gráfico
    if (currentHour <= 0) currentHour = 1

    const lastBaseHour = Math.max(0, currentHour - 1) // ex: 14

    const result: { label: string; totalNet: number }[] = []

    // de 0h até (hora atual - 1) com dados reais
    for (let h = 0; h <= lastBaseHour; h++) {
      result.push({
        label: `${String(h).padStart(2, '0')}h`,
        totalNet: byHour.get(h) ?? 0,
      })
    }

    // ponto extra na HORA ATUAL com o mesmo valor da última hora real
    const lastValue = result[result.length - 1]?.totalNet ?? 0
    result.push({
      label: `${String(currentHour).padStart(2, '0')}h`,
      totalNet: lastValue,
    })

    return result
  }, [summary, period, selectedDate])




  // ===== COMPARAÇÃO INTRADIÁRIA (HOJE x ONTEM) =====
  const intradayDelta = useMemo(() => {
    if (period !== 'today') return null
    if (!summary || !yesterdaySummary || !isSelectedToday) return null

    const now = new Date()
    const currentHour = now.getHours()

    const sumUpToHour = (series: DailyPoint[]) =>
      series.reduce((acc, p) => {
        const d = new Date(p.date)
        if (d.getHours() <= currentHour) {
          return acc + p.totalNet
        }
        return acc
      }, 0)

    const todayTotal = sumUpToHour(summary.dailySeries)
    const yesterdayTotal = sumUpToHour(yesterdaySummary.dailySeries)

    const diff = todayTotal - yesterdayTotal
    const perc = yesterdayTotal > 0 ? (diff / yesterdayTotal) * 100 : null

    return {
      todayTotal,
      yesterdayTotal,
      diff,
      perc,
    }
  }, [summary, yesterdaySummary, isSelectedToday, period])

  // ======== BASE PARA O FUNDO VIR DO TOPO ATÉ A LINHA ========
  const maxNetValue = useMemo(() => {
    if (!chartData.length) return 0
    return Math.max(...chartData.map((p) => p.totalNet))
  }, [chartData])

  const maxDomain = maxNetValue > 0 ? maxNetValue * 4 : 1

  // helpers de período rápido no settings
  const setToday = () => {
    const today = new Date()
    setSelectedDate(toYMD(today))
    setPeriod('today')
  }

  const setYesterday = () => {
    const y = addDays(new Date(), -1)
    setSelectedDate(toYMD(y))
    setPeriod('yesterday')
  }

  const setLast7 = () => {
    setSelectedDate(toYMD(new Date()))
    setPeriod('last7')
  }

  const setLast30 = () => {
    setSelectedDate(toYMD(new Date()))
    setPeriod('last30')
  }

  // quick stats
  const quickOrders = summary?.totalOrders ?? 0
  const quickTicket = summary?.averageTicket ?? 0 // reservado se quiser usar depois
  const quickGross = summary?.totalGross ?? 0 // reservado
  const quickNet = summary?.totalNet ?? 0

  // índice de atividade (0 a 100) baseado na quantidade de pedidos
  const quickActivityIndex = Math.max(
    0,
    Math.min(100, Math.round((quickOrders / 1000) * 100)),
  )

  const partnerShares = useMemo(() => {
    if (!summary || quickNet <= 0) return []
    return summary.partners
      .map((p) => ({
        id: p.id,
        siteName: p.siteName,
        perc: (p.totalNet / quickNet) * 100,
      }))
      .sort((a, b) => b.perc - a.perc)
  }, [summary, quickNet])

  // ===== GUARDS =====

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

  // 🔒 enquanto ainda descobre se é mobile + usuário
  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  // 🔑 sessão expirada → bolinha + redirect pra /mobile/login
  if (!user) {
    return <ExpiredRedirectSpinner />
  }

  // 📊 carregando dados da página (dashboard, atividade, etc)
  if (loading && !summary) {
    return <FullscreenLoader />
  }
  // ===== TELA NORMAL =====
  return (
    <>
      <div className="flex min-h-screen flex-col bg-black text-white">
        {/* WALLET HERO */}
        <section className="relative z-10 w-full pt-8 pb-6 px-6">
          {/* FUNDO BRANCO VINDO DO TOPO ATÉ A LINHA */}
          <div className="pointer-events-none absolute inset-x-0 top-[0rem] h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart
                data={chartData}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              >
                <defs>
                   <linearGradient id="walletArea" x1="0" y1="0" x2="0" y2="1">
                      {/* bem branco lá em cima, sumindo pro preto */}
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.36)" />
                      <stop offset="45%" stopColor="rgba(255, 255, 255, 0.12)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, maxDomain]} />

                <Tooltip
                  content={
                    <WalletTooltip
                      showValue={showBalance}
                      formatter={(v: number) => formatAmount(v)}
                    />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="totalNet"
                  stroke="#7e7e7eff"
                  strokeWidth={2.0}
                  fill="url(#walletArea)"
                  fillOpacity={1}
                  baseValue={maxDomain}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>

          {/* ======= Conteúdo do HERO ======= */}
          <div className="relative z-10">
            {/* topo: título + ícones à direita */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="mt-1 text-[22px] font-semibold">Dashboard</h1>
              </div>

              <div className="flex items-center gap-2">
                {/* botão olho (esconde/mostra valores) */}
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5"
                  type="button"
                  onClick={() => setShowBalance((v) => !v)}
                >
                  {showBalance ? (
                    <Eye className="h-4 w-4 text-white/70" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-white/70" />
                  )}
                </button>

                <button className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                  <Bell className="h-4 w-4 text-white/70" />
                </button>

                {/* botão settings com popover */}
                <div className="relative">
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5"
                    type="button"
                    onClick={() => {
                      if (!settingsOpen) {
                        setSettingsOpen(true)
                        setSettingsClosing(false)
                      } else {
                        setSettingsClosing(true)
                        setTimeout(() => setSettingsOpen(false), 160)
                      }
                    }}
                  >
                    <Settings className="h-4 w-4 text-white/70" />
                  </button>

                  {settingsOpen && (
                    <div
                      ref={settingsRef}
                      className={`absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#050505]/80 backdrop-blur-md shadow-xl z-30 origin-top-right ${
                        settingsClosing ? 'animate-scaleOut' : 'animate-scaleIn'
                      }`}
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs font-medium text-white/80">
                          Configurações da wallet
                        </p>
                        <p className="mt-1 text-[10px] text-white/40">
                          Personalize a moeda e o período padrão.
                        </p>
                      </div>

                      {/* moeda */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-[11px] text-white/60 mb-2">
                          Moeda de exibição
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrency('BRL')}
                            className={`flex-1 rounded-full border px-2 py-1 text-[11px] ${
                              currency === 'BRL'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-transparent'
                            }`}
                          >
                            Real (R$)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrency('USD')}
                            className={`flex-1 rounded-full border px-2 py-1 text-[11px] ${
                              currency === 'USD'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-transparent'
                            }`}
                          >
                            Dólar (US$)
                          </button>
                        </div>
                      </div>

                      {/* período rápido */}
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-white/60 mb-2">
                          Atalho de data
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={setToday}
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                              period === 'today'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-white/5'
                            }`}
                          >
                            Hoje
                          </button>
                          <button
                            type="button"
                            onClick={setYesterday}
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                              period === 'yesterday'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-white/5'
                            }`}
                          >
                            Ontem
                          </button>
                          <button
                            type="button"
                            onClick={setLast7}
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                              period === 'last7'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-white/5'
                            }`}
                          >
                            7 dias
                          </button>
                          <button
                            type="button"
                            onClick={setLast30}
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                              period === 'last30'
                                ? 'border-white text-white bg-white/10'
                                : 'border-white/10 text-white/60 bg-white/5'
                            }`}
                          >
                            1 mês
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* bloco central: valor + delta + data, tudo no meio */}
            <div className="flex flex-col items-center text-center">
              <p className="mt-1 text-[30px] font-semibold leading-none">
                {showBalance
                  ? formatAmountNoSpace(summary?.totalNet ?? 0)
                  : '••••••••••'}
              </p>

              {/* DELTA HOJE x ONTEM CENTRALIZADO */}
              {showBalance && intradayDelta && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[11px]">
                  {intradayDelta.diff > 0 && (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {intradayDelta.diff < 0 && (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  )}

                  <span
                    className={
                      intradayDelta.diff > 0
                        ? 'text-emerald-400 font-medium'
                        : intradayDelta.diff < 0
                        ? 'text-red-400 font-medium'
                        : 'text-white/60'
                    }
                  >
                    {intradayDelta.perc?.toFixed(2)}%
                  </span>

                  <span className="text-white/60">
                    (
                    {intradayDelta.diff > 0 ? '+ ' : '- '}
                    {formatAmountNoSpace(Math.abs(intradayDelta.diff))}
                    )
                  </span>
                </div>
              )}

              {/* label de período */}
              <p className="mt-3 text-[11px] text-white/55">{dateChipText}</p>
            </div>
          </div>
        </section>

        {/* ====== MINI DASH DE RESUMO (MEIO DA TELA) ====== */}
        <section className="relative z-20 mt-44 px-6 pb-4">
          <div className="mb-3 flex items-center justify-between text-[11px] text-white/45" />

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            {/* Pedidos */}
            <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/50">Pedidos Pagos</p>
                  <p className="mt-1 text-sm font-semibold">
                    {quickOrders.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <ShoppingBag className="h-3.5 w-3.5 text-white/70" />
                </div>
              </div>
            </div>

            {/* Índice de atividade */}
            <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/50">
                    Índice de atividade
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {quickActivityIndex}/100
                  </p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <BarChart2 className="h-3.5 w-3.5 text-white/70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== ATIVIDADE RECENTE ====== */}
        {summary && (
          <section className="relative z-20 mt-4 px-6 pb-28 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/45">
                <span>Atividade recente</span>
                <span className="text-white/30">
                  {summary.lastOrders.length > 0
                    ? `Últimas ${Math.min(
                        4,
                        summary.lastOrders.length,
                      )} vendas`
                    : 'Sem movimentação'}
                </span>
              </div>

              <div className="space-y-2">
                {summary.lastOrders.slice(0, 4).map((order) => {
                  const date = new Date(order.createdAt)
                  const hourLabel = date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })

                  const statusLabel =
                    order.status === 'paid'
                      ? 'Pago'
                      : order.status === 'pending'
                      ? 'Pendente'
                      : 'Estornado'

                  const statusClasses =
                    order.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : order.status === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30'

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3.5 py-2.5"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] text-white/45">
                          {hourLabel}
                        </span>
<span className="text-[12px] font-medium text-white/80">
  Pedido #{order.id.slice(-6)}
</span>


                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                        {order.source && (
                          <span className="text-[9px] text-white/35 uppercase tracking-[0.16em]">
                            {order.source}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </div>

<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/95 backdrop-blur-md">
  <div className="mx-auto max-w-md">
    <div className="flex items-center justify-around px-4 py-6 text-[11px] translate-y-[-8px]">
      <Link
        href="/mobile"
        className="flex flex-col items-center gap-1 text-white"
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
        className="flex flex-col items-center gap-1 text-white/60"
      >
        <Settings className="h-4 w-4" />
        <span>Configurações</span>
      </Link>
    </div>
  </div>
</nav>



      {/* animações (popover settings) */}
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
