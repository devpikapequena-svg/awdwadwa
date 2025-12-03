// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import {
  Wallet2,
  LineChart as LineChartIcon,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

type User = {
  id: string
  name: string
  email: string
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

type DailyPoint = {
  date: string // ISO - pode ser dia ou hora
  totalGross: number
  totalNet: number
  myCommission: number
  orders: number
}

type DashboardSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
  partners: PartnerSummary[]
  dailySeries: DailyPoint[]
}

type PeriodFilter = 'today' | 'yesterday' | 'last7' | 'last30'

// ---- helpers de série pra deixar o gráfico bonito ----

/**
 * Prepara série por HORA (0h..23h) a partir dos pontos vindos da API.
 * - Compacta por hora (caso venham vários pontos na mesma hora)
 * - Preenche horas sem movimento com 0
 * - Adiciona label "00h", "01h" etc pra usar no eixo X
 */
function buildHourlySeries(series: DailyPoint[]) {
  const byHour = new Map<number, number>() // hour -> totalGross da hora

  series.forEach((p) => {
    const d = new Date(p.date)
    const h = d.getHours()
    byHour.set(h, (byHour.get(h) ?? 0) + (p.totalGross || 0))
  })

  const data: { hour: number; label: string; totalGross: number }[] = []

  let running = 0
  for (let h = 0; h < 24; h++) {
    const valueThisHour = byHour.get(h) ?? 0
    running += valueThisHour // deixa acumulado pra linha não ficar “dura”

    data.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}h`,
      totalGross: running,
    })
  }

  return data
}

/**
 * Série por DIA (quando período for 7 / 30 dias)
 */
function buildDailySeries(series: DailyPoint[]) {
  const sorted = [...series].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  let running = 0
  return sorted.map((p) => {
    running += p.totalGross || 0
    return {
      label: new Date(p.date).toISOString().slice(0, 10), // AAAA-MM-DD
      totalGross: running,
    }
  })
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today')

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
      } catch {
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchSummary = async () => {
      try {
        setLoadingSummary(true)
        const res = await fetch(
          `/api/dashboard/summary?period=${periodFilter}`,
          {
            method: 'GET',
            credentials: 'include',
          },
        )

        if (!res.ok) {
          setSummary(null)
          return
        }

        const data = await res.json()
        setSummary(data)
      } catch {
        setSummary(null)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchSummary()
  }, [user, periodFilter])

  if (loadingUser) {
    return (
      <main className="flex min-h-screen bg-[#050505] text-white">
        <aside className="w-64 border-r border-[#161616] bg-[#080808]" />
        <section className="flex-1 px-10 py-10">
          <div className="h-6 w-40 rounded-full bg-[#141414]" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-[#161616] bg-[#080808]"
              />
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar seu painel financeiro.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const periodLabel = summary?.periodLabel || 'Hoje'
  const partnersCount = summary?.partners?.length ?? 0

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const rawSeries: DailyPoint[] = summary?.dailySeries ?? []

  const isHourly =
    periodFilter === 'today' || periodFilter === 'yesterday'

  const chartData = isHourly
    ? buildHourlySeries(rawSeries)
    : buildDailySeries(rawSeries)

  const periodFilterLabel =
    periodFilter === 'today'
      ? 'Hoje'
      : periodFilter === 'yesterday'
      ? 'Ontem'
      : periodFilter === 'last7'
      ? 'Últimos 7 dias'
      : 'Últimos 30 dias'

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-7xl flex flex-col gap-8">
          {/* HEADER PREMIUM */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Visão geral financeira
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Acompanhe faturamento, lucro líquido e a sua comissão em cima
                  do lucro dos sites operados com os parceiros.
                </p>

                {summary && (
                  <p className="mt-2 text-[11px] text-white/45">
                    No período selecionado, foram registrados{' '}
                    <span className="font-semibold text-white/80">
                      {summary.totalOrders} pedidos
                    </span>{' '}
                    com ticket médio de{' '}
                    <span className="font-semibold text-white/80">
                      {summary.averageTicket
                        ? formatCurrency(summary.averageTicket)
                        : '—'}
                    </span>
                    .
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-3 text-xs md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
                    <Wallet2 className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">
                      Período selecionado
                    </span>
                    <span className="text-[11px] text-white/80">
                      {periodLabel}
                    </span>
                  </div>
                </div>

                {/* seletor de período */}
                <div className="inline-flex overflow-hidden rounded-full border border-[#262626] bg-[#080808] text-[11px]">
                  {(['today', 'yesterday', 'last7', 'last30'] as PeriodFilter[]).map(
                    (val) => {
                      const label =
                        val === 'today'
                          ? 'Hoje'
                          : val === 'yesterday'
                          ? 'Ontem'
                          : val === 'last7'
                          ? 'Últimos 7'
                          : 'Últimos 30'
                      const active = periodFilter === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPeriodFilter(val)}
                          className={`px-3 py-1.5 transition ${
                            active
                              ? 'bg-white text-black'
                              : 'text-white/55 hover:bg-white/5'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    },
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* KPI CARDS */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4 mt-1">
            <DashboardStatCard
              icon={ShoppingBag}
              label="Faturamento bruto"
              value={
                loadingSummary || !summary
                  ? '—'
                  : formatCurrency(summary.totalGross)
              }
              hint="Tudo que entrou nos sites antes de taxas e rateios."
            />
            <DashboardStatCard
              icon={LineChartIcon}
              label="Lucro líquido dos projetos"
              value={
                loadingSummary || !summary
                  ? '—'
                  : formatCurrency(summary.totalNet)
              }
              hint="Valor que sobra para divisão entre você e os parceiros."
            />
            <DashboardStatCard
              icon={Wallet2}
              label="Sua parte (30% do lucro)"
              value={
                loadingSummary || !summary
                  ? '—'
                  : formatCurrency(summary.myCommissionTotal)
              }
              hint="Sua comissão calculada em cima do lucro líquido."
              accent
            />
            <DashboardStatCard
              icon={Users}
              label="Parceiros com venda"
              value={
                loadingSummary || !summary
                  ? '—'
                  : partnersCount.toString()
              }
              hint="Quantos parceiros tiveram vendas nesse período."
            />
          </section>

          {/* GRID INFERIOR: GRÁFICO + RESUMOS */}
          <div className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-6 md:px-7 md:py-7 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <div className="pointer-events-none absolute -left-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <section className="relative grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Coluna esquerda – GRÁFICO ÚNICO */}
              <div className="rounded-2xl border border-[#202020] bg-[#080808] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-white/60">Receita</p>
                    <p className="text-2xl font-semibold tracking-tight text-white">
                      {summary
                        ? formatCurrency(summary.totalGross)
                        : 'R$ 0,00'}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/45">
                    {periodFilterLabel}
                  </span>
                </div>

                {loadingSummary ? (
                  <div className="h-56 rounded-xl border border-[#262626] bg-black/30" />
                ) : chartData.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#262626] bg-black/30 px-4 py-4 text-xs text-white/60">
                    Ainda não há dados suficientes para desenhar o gráfico nesse
                    período.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="#1f2933"
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            borderRadius: 12,
                            border: '1px solid #27272a',
                            fontSize: 11,
                          }}
                          labelFormatter={(value: string) => value}
                          formatter={(val: any) => {
                            return [
                              (val as number).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }),
                              'Receita',
                            ]
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalGross"
                          stroke="#ffffff"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Coluna direita – Resumo por parceiro + resumo do período */}
              <div className="space-y-6">
                {/* Resumo por parceiro */}
                <div className="rounded-2xl border border-[#202020] bg-[#080808] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">
                        Resumo por parceiro
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-black/30 px-2.5 py-1 text-[10px] text-white/60">
                      <Users className="h-3 w-3" />
                      {partnersCount} parceiros
                    </span>
                  </div>

                  {loadingSummary ? (
                    <div className="h-28 rounded-xl border border-[#262626] bg-black/30" />
                  ) : summary && partnersCount > 0 ? (
                    <ul className="space-y-2 text-[11px]">
                      {summary.partners.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-[#262626] bg-black/30 px-4 py-3"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-white/85">
                              {p.name}
                              <span className="ml-1 text-white/40">
                                · {p.siteName}
                              </span>
                            </span>
                            <span className="text-[10px] text-white/55">
                              {p.totalOrders} pedidos ·{' '}
                              {formatCurrency(p.totalGross)} bruto ·{' '}
                              {formatCurrency(p.totalNet)} lucro
                            </span>
                          </div>
                          <div className="text-right text-[10px] text-white/60">
                            <p>Sua parte (30%)</p>
                            <p className="font-semibold text-emerald-300">
                              {formatCurrency(p.myCommission)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-[#262626] bg-black/30 px-4 py-4 text-xs text-white/60">
                      Nenhum parceiro com vendas nesse período.
                    </div>
                  )}
                </div>

                {/* Resumo do período */}
                <div className="rounded-2xl border border-[#202020] bg-[#080808] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Resumo do período</h2>
                    <span className="text-[10px] text-white/45">
                      {periodFilterLabel}
                    </span>
                  </div>

                  {summary ? (
                    <div className="space-y-3 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Ticket médio</span>
                        <span className="font-semibold text-white/85">
                          {summary.averageTicket
                            ? formatCurrency(summary.averageTicket)
                            : '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60">
                          Faturamento vs lucro
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <ArrowUpRight className="h-3 w-3" />
                          {formatCurrency(summary.totalNet)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Sua comissão</span>
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <ArrowDownRight className="h-3 w-3" />
                          {formatCurrency(summary.myCommissionTotal)}
                        </span>
                      </div>

                      <p className="mt-3 text-[10px] text-white/45 leading-relaxed">
                        Use esse painel para bater metas semanais ou mensais. Se
                        a linha estiver “reta”, é sinal de que os sites
                        precisam de mais tráfego e campanha.
                      </p>
                    </div>
                  ) : (
                    <div className="h-20 rounded-xl border border-[#262626] bg-black/20" />
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

/* COMPONENTES */

type StatCardProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  accent?: boolean
}

function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: StatCardProps) {
  return (
    <div
      className="
        relative rounded-2xl border border-[#1f1f1f]
        bg-gradient-to-br from-[#0b0b0b] via-[#090909] to-[#050505]
        px-5 py-4 shadow-[0_0_20px_rgba(0,0,0,0.35)]
        hover:shadow-[0_0_35px_rgba(0,0,0,0.55)]
        transition-all duration-300 overflow-hidden
      "
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-24 w-24 rounded-full ${
          accent ? 'bg-emerald-500/10' : 'bg-white/5'
        } blur-2xl`}
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-white/55">{label}</p>
            <p
              className={`text-lg font-semibold tracking-tight ${
                accent ? 'text-emerald-300' : 'text-white'
              }`}
            >
              {value}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30 border border-white/5">
            <Icon className="h-4.5 w-4.5 text-white/70" />
          </div>
        </div>

        {hint && (
          <p className="text-[10px] leading-relaxed text-white/40">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
