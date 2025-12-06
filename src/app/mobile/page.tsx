'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Wallet2,
  ShoppingBag,
  LineChart as LineChartIcon,
  Bell,
  Settings,
  Home,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// TYPES ----------------------------------------

type User = {
  id: string
  name: string
  email: string
}

type OrderStatus = 'paid' | 'pending' | 'refunded'

type Sale = {
  id: string
  siteName: string
  partnerName: string
  buckpayOrderId?: string | null
  amount: number
  netAmount: number
  myCommission: number
  status: OrderStatus
  paymentMethod: 'pix' | 'card' | 'boleto' | string
  source?: string | null
  campaign?: string | null
  createdAt: string
  customerName?: string | null
  gateway?: 'buckpay' | 'blackcat' | string
}

type SalesSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
}

type SalesResponse = {
  summary: SalesSummary
  orders: Sale[]
}

type ChartPoint = {
  hourLabel: string
  total: number
}

// ----------------------------------------------
// LOADER PREMIUM EM TELA CHEIA
// ----------------------------------------------
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

export default function MobileDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [orders, setOrders] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(true)

  const [periodFilter, setPeriodFilter] =
    useState<'today' | 'yesterday' | 'last7' | 'last30'>('today')

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  // Detectar se é mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Buscar usuário ---------------------------------
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
          setUser(await res.json())
        }
      } catch {
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  // Buscar vendas ----------------------------------
  useEffect(() => {
    if (!user) return

    const fetchSales = async () => {
      try {
        setLoadingSales(true)

        const res = await fetch(`/api/vendas?period=${periodFilter}`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setSummary(null)
          setOrders([])
          return
        }

        const data: SalesResponse = await res.json()
        setSummary(data.summary ?? null)
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch {
        setSummary(null)
        setOrders([])
      } finally {
        setLoadingSales(false)
      }
    }

    fetchSales()
  }, [user, periodFilter])

  // Formatador
  const formatCurrency = (value: number | null | undefined) =>
    (value ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  // Cálculo de resumo
  const paidOrders = orders.filter((o) => o.status === 'paid')

  const paidSummary = (() => {
    const totalOrdersPaid = paidOrders.length
    const totalGrossPaid = paidOrders.reduce((acc, o) => acc + o.amount, 0)
    const totalNetPaid = paidOrders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotalPaid = paidOrders.reduce(
      (acc, o) => acc + o.myCommission,
      0,
    )
    return {
      totalOrdersPaid,
      totalGrossPaid,
      totalNetPaid,
      myCommissionTotalPaid,
      averageTicketPaid:
        totalOrdersPaid > 0 ? totalGrossPaid / totalOrdersPaid : null,
    }
  })()

  const periodLabel = summary?.periodLabel || 'Hoje'

  // Dados do gráfico
  const chartData: ChartPoint[] = (() => {
    if (paidOrders.length === 0) {
      return Array.from({ length: 6 }).map((_, idx) => ({
        hourLabel: `${idx * 4}h`,
        total: 0,
      }))
    }

    const map = new Map<number, number>()
    for (const o of paidOrders) {
      const hour = new Date(o.createdAt).getHours()
      map.set(hour, (map.get(hour) || 0) + o.amount)
    }

    const points: ChartPoint[] = []
    for (let h = 0; h < 24; h += 2) {
      let sum = 0
      for (let inner = h; inner < h + 2; inner++) sum += map.get(inner) || 0
      points.push({ hourLabel: `${h}h`, total: sum })
    }
    return points
  })()

  // ------------------------------------------------
  // LOADING INICIAL DA PÁGINA (TELA PRETA + BOLINHA TOP)
  // ------------------------------------------------
  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  // Sessão expirada
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white px-4">
        <div className="w-full max-w-sm rounded-3xl border border-[#191919] bg-gradient-to-b from-[#0b0b0b] via-[#050505] to-[#050505] px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
              <Settings className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-white/45">Sessão encerrada</span>
              <span className="text-sm font-semibold">
                Faça login para voltar ao painel
              </span>
            </div>
          </div>

          <p className="mt-4 text-[12px] text-white/60">
            Entre novamente para acompanhar suas vendas e comissões.
          </p>

          <button
            onClick={() => router.push('/mobile/login')}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white text-black text-xs font-semibold py-2.5 shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition"
          >
            Ir para login
          </button>
        </div>
      </main>
    )
  }

  // ------------------------------------------------
  // PÁGINA PRINCIPAL
  // ------------------------------------------------

  const recentOrders = paidOrders
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5)

  return (
    <main className="flex min-h-screen flex-col bg-[#050505] text-white">
      {/* HEADER ------------------------------------------------ */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#171717] bg-gradient-to-r from-[#050505] via-[#070707] to-[#050505] px-4 pb-3 pt-[16px]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <Wallet2 className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/50">
              Bom dia, {user.name?.split(' ')[0] || 'parceiro(a)'}
            </span>
            <span className="text-sm font-semibold">Seu painel de vendas</span>
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

      {/* SCROLL CONTENT ---------------------------------------- */}
      <section className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-6">
          {/* CARD PRINCIPAL (GREEN WALLET) ----------------------- */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-black/15 blur-xl" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-emerald-50/80">
                  Comissão no período
                </span>

                <span className="text-2xl font-semibold tracking-tight text-emerald-950">
                  {formatCurrency(paidSummary.myCommissionTotalPaid)}
                </span>

                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-900/20 px-2 py-0.5 text-[10px] text-emerald-950">
                  {periodLabel}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-emerald-50/80">
                  Vendas pagas
                </span>
                <span className="text-lg font-semibold text-emerald-950">
                  {paidSummary.totalOrdersPaid}
                </span>
                <span className="text-[10px] text-emerald-50/70">
                  Ticket médio:{' '}
                  {formatCurrency(paidSummary.averageTicketPaid)}
                </span>
              </div>
            </div>
          </div>

          {/* VISÃO GERAL ---------------------------------------- */}
          <div className="flex flex-col gap-3 rounded-3xl border border-[#151515] bg-[#070707] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <Wallet2 className="h-3.5 w-3.5 text-emerald-300" />
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-white/45">
                    Visão geral do período
                  </span>
                  <span className="text-xs font-semibold">{periodLabel}</span>
                </div>
              </div>

              {/* PERIOD FILTER */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/45">Período</span>

                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-1 py-0.5 text-[10px]">
                  <PeriodChip
                    label="Hoje"
                    active={periodFilter === 'today'}
                    onClick={() => setPeriodFilter('today')}
                  />
                  <PeriodChip
                    label="Ontem"
                    active={periodFilter === 'yesterday'}
                    onClick={() => setPeriodFilter('yesterday')}
                  />
                  <PeriodChip
                    label="7d"
                    active={periodFilter === 'last7'}
                    onClick={() => setPeriodFilter('last7')}
                  />
                  <PeriodChip
                    label="30d"
                    active={periodFilter === 'last30'}
                    onClick={() => setPeriodFilter('last30')}
                  />
                </div>
              </div>
            </div>

            {/* MINI CARDS */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/3 px-2.5 py-2">
                <p className="text-[10px] text-white/55">Bruto</p>
                <p className="text-xs font-semibold">
                  {formatCurrency(paidSummary.totalGrossPaid)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/3 px-2.5 py-2">
                <p className="text-[10px] text-white/55">Líquido</p>
                <p className="text-xs font-semibold">
                  {formatCurrency(paidSummary.totalNetPaid)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/3 px-2.5 py-2">
                <p className="text-[10px] text-white/55">Pedidos</p>
                <p className="text-xs font-semibold">
                  {paidSummary.totalOrdersPaid}
                </p>
              </div>
            </div>
          </div>

          {/* GRÁFICO -------------------------------------------- */}
          <div className="rounded-3xl border border-[#202020] bg-[#070707] p-4 shadow-[0_0_25px_rgba(0,0,0,0.7)]">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                <LineChartIcon className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <p className="text-xs font-semibold">Receita ao longo do dia</p>
            </div>

            <div className="h-44">
              {loadingSales ? (
                <div className="flex h-full items-center justify-center">
                  {/* mini loader no gráfico */}
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData} margin={{ left: -20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hourLabel"
                      tick={{
                        fontSize: 10,
                        fill: 'rgba(255,255,255,0.45)',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050505',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: 8,
                      }}
                      labelStyle={{
                        color: 'rgba(255,255,255,0.7)',
                      }}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ÚLTIMAS VENDAS ------------------------------------- */}
          <div className="rounded-3xl border border-[#191919] bg-[#070707] p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <p className="text-xs font-semibold">Últimas vendas pagas</p>
            </div>

            {loadingSales ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl bg-white/3 px-3 py-6 text-center">
                <p className="text-[11px] text-white/55">
                  Nenhuma venda paga nesse período ainda.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-2xl bg-white/3 px-3 py-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white/85">
                        {o.customerName || 'Cliente'}
                      </span>
                      <span className="text-[10px] text-white/45">
                        {o.siteName} • {o.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-emerald-300">
                        {formatCurrency(o.myCommission)}
                      </span>
                      <span className="text-[10px] text-white/50">
                        Pedido: {formatCurrency(o.amount)}
                      </span>
                    </div>
                  </div>
                ))}
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
    </main>
  )
}

// CHIP DO FILTRO DE PERÍODO ------------------------
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
