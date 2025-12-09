// src/app/dashboard/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

type DailyPoint = {
  date: string
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
  dailySeries: DailyPoint[]
}

type UserMe = {
  id: string
  name: string
  email: string
  plan?: string
}

/* =============== LOADER FULLSCREEN =============== */

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

/* ================================================= */

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number | null | undefined) {
  if (value == null) return 'R$ 0,00'
  return currency.format(value)
}

function formatLabel(dateStr: string, isHourly: boolean) {
  const d = new Date(dateStr)
  if (isHourly) {
    const h = d.getHours().toString().padStart(2, '0')
    return `${h}h`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]
  return (
    <div className="rounded-lg border border-[#151515] bg-[#050505] px-3 py-2 text-xs text-white/80">
      <p className="mb-1 text-[11px] text-white/60">{label}</p>
      <p className="font-medium">
        Faturamento líquido: {formatCurrency(item.value)}
      </p>
    </div>
  )
}

// helpers de data
function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number) {
  const dd = new Date(base)
  dd.setDate(dd.getDate() + days)
  return dd
}

// célula do calendário
type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // data selecionada (sempre um único dia)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toYMD(new Date()),
  )

  // mês do calendário aberto
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarClosing, setCalendarClosing] = useState(false)

  const calendarRef = useRef<HTMLDivElement | null>(null)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [yesterdaySummary, setYesterdaySummary] =
    useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const isHourly = true

  // hoje "zerado" (pra comparação de futuro)
  const todayDate = useMemo(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0)
  }, [])

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

  // quando mudar selectedDate, garante que o calendário está no mesmo mês
  useEffect(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [selectedDate])

  // ===== AUTH GUARD / USER =====
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          router.replace('/login')
          return
        }

        const data = await res.json()
        setUser(data)
      } catch (e) {
        console.error('Erro ao carregar usuário', e)
        router.replace('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [router])

  // clique fora do calendário -> anima e fecha
  useEffect(() => {
    if (!calendarOpen) return

    function handleClickOutside(ev: MouseEvent) {
      if (!calendarRef.current) return
      if (!calendarRef.current.contains(ev.target as Node)) {
        setCalendarClosing(true)
        setTimeout(() => setCalendarOpen(false), 160)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  // carregar dashboard da data selecionada + dia anterior
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

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
          const data = await resCurrent.json()
          setSummary(data)
        } else {
          setSummary(null)
        }

        if (resPrev.ok) {
          const dataPrev = await resPrev.json()
          setYesterdaySummary(dataPrev)
        } else {
          setYesterdaySummary(null)
        }
      } catch (e) {
        console.error('Erro ao carregar dashboard', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate])

  const chartData = useMemo(() => {
    if (!summary) return []

    // sempre 00h–23h
    const byHour = new Map<number, DailyPoint>()

    summary.dailySeries.forEach((p) => {
      const d = new Date(p.date)
      const h = d.getHours()
      const existing = byHour.get(h)
      if (existing) {
        byHour.set(h, {
          ...existing,
          totalGross: existing.totalGross + p.totalGross,
          totalNet: existing.totalNet + p.totalNet,
          myCommission: existing.myCommission + p.myCommission,
          orders: existing.orders + p.orders,
        })
      } else {
        byHour.set(h, p)
      }
    })

    const result = []
    for (let h = 0; h < 24; h++) {
      const p = byHour.get(h)
      result.push({
        date: p?.date ?? '',
        totalGross: p?.totalGross ?? 0,
        totalNet: p?.totalNet ?? 0,
        myCommission: p?.myCommission ?? 0,
        orders: p?.orders ?? 0,
        label: `${String(h).padStart(2, '0')}h`,
      })
    }
    return result
  }, [summary])

  // comparação intradiária só quando data selecionada é hoje
  const intradayDelta = useMemo(() => {
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
      hourLabel: `${currentHour.toString().padStart(2, '0')}h`,
    }
  }, [summary, yesterdaySummary, isSelectedToday])

  // ====== CALENDÁRIO (com dias de outros meses) ======
  const weeks = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()

    const firstDayCurrent = new Date(year, month, 1)
    const firstWeekday = firstDayCurrent.getDay() // 0-dom ... 6-sab
    const daysInCurrent = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const matrix: CalendarCell[][] = []

    // primeira semana (pode ter dias do mês anterior)
    let week: CalendarCell[] = []
    let currentDay = 1
    let nextMonthDay = 1

    for (let i = 0; i < 7; i++) {
      if (i < firstWeekday) {
        const dayFromPrev = daysInPrev - (firstWeekday - 1 - i)
        week.push({
          date: new Date(year, month - 1, dayFromPrev),
          inCurrentMonth: false,
        })
      } else {
        week.push({
          date: new Date(year, month, currentDay++),
          inCurrentMonth: true,
        })
      }
    }
    matrix.push(week)

    // próximas semanas
    while (currentDay <= daysInCurrent) {
      week = []
      for (let i = 0; i < 7; i++) {
        if (currentDay <= daysInCurrent) {
          week.push({
            date: new Date(year, month, currentDay++),
            inCurrentMonth: true,
          })
        } else {
          week.push({
            date: new Date(year, month + 1, nextMonthDay++),
            inCurrentMonth: false,
          })
        }
      }
      matrix.push(week)
    }

    return matrix
  }, [calendarMonth])

  const handleSelectDay = (date: Date, isFuture: boolean) => {
    if (isFuture) return
    setSelectedDate(toYMD(date))
    setCalendarClosing(true)
    setTimeout(() => setCalendarOpen(false), 160)
  }

  // mês máximo permitido (mês atual)
  const maxMonth = useMemo(() => {
    return new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  }, [todayDate])

  const canGoNextMonth = useMemo(() => {
    const cm = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    )
    return cm < maxMonth
  }, [calendarMonth, maxMonth])

  // ===== GUARD: enquanto carrega auth, só a bolinha =====
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#070707] text-white">
        {/* Sidebar sempre aparece, mesmo antes do user real carregar */}
        <Sidebar
          user={
            user || {
              id: '',
              name: '',
              email: '',
            }
          }
        />

      <main className="px-6 py-8 md:px-10 md:py-10 md:ml-64">
          {/* HEADER TOP */}
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-2 text-[24px] md:text-[26px] font-semibold">
                Dashboard financeiro
              </h1>
            </div>

            {/* FILTRO DE DATA */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!calendarOpen) {
                      setCalendarOpen(true)
                      setCalendarClosing(false)
                    } else {
                      setCalendarClosing(true)
                      setTimeout(() => setCalendarOpen(false), 160)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#151515] bg-[#050505] px-3 py-2 text-xs text-white/80 hover:bg-[#111111] transition-colors"
                >
                  <CalendarDays className="h-4 w-4 text-white/70" />
                  <span className="whitespace-nowrap">
                    {selectedDateLabel}
                  </span>
                </button>

                {calendarOpen && (
                  <div
                    ref={calendarRef}
                    className={`absolute right-0 mt-2 w-72 rounded-xl border border-[#151515] bg-[#050505] shadow-xl z-30 origin-top-right ${
                      calendarClosing ? 'animate-scaleOut' : 'animate-scaleIn'
                    }`}
                  >
                    {/* cabeçalho mês/ano */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/5"
                      >
                        <ChevronLeft className="h-4 w-4 text-white/70" />
                      </button>
                      <span className="text-xs font-medium text-white/80">
                        {calendarMonth.toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={!canGoNextMonth}
                        onClick={() => {
                          if (!canGoNextMonth) return
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() + 1,
                              1,
                            ),
                          )
                        }}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                          canGoNextMonth
                            ? 'hover:bg-white/5'
                            : 'opacity-30 cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight className="h-4 w-4 text-white/70" />
                      </button>
                    </div>

                    {/* dias da semana */}
                    <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-[10px] text-white/40">
                      {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(
                        (d) => (
                          <span
                            key={d}
                            className="flex items-center justify-center"
                          >
                            {d}
                          </span>
                        ),
                      )}
                    </div>

                    {/* dias */}
                    <div className="grid grid-cols-7 gap-1 px-3 pb-3 pt-2 text-xs">
                      {weeks.map((week, wi) =>
                        week.map((cell, di) => {
                          const dateObj = cell.date
                          const current = toYMD(dateObj)
                          const isSelected = current === selectedDate
                          const isFuture = dateObj > todayDate
                          const inCurrentMonth = cell.inCurrentMonth

                          let classes = ''

                          if (isFuture) {
                            // futuro: apagado e sem hover
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/20 opacity-40 cursor-not-allowed'
                          } else if (isSelected) {
                            // dia selecionado (cinza escuro)
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md bg-[#2b2b2b] text-white'
                          } else if (!inCurrentMonth) {
                            // dias do mês anterior/próximo (mais cinza)
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/35 hover:bg-white/5 transition-colors'
                          } else {
                            // mês atual normal
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:bg-white/5 transition-colors'
                          }

                          return (
                            <button
                              key={`${wi}-${di}`}
                              type="button"
                              onClick={() =>
                                handleSelectDay(dateObj, isFuture)
                              }
                              className={classes}
                            >
                              {dateObj.getDate()}
                            </button>
                          )
                        }),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* KPIs */}
          <section className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="border border-[#151515] rounded-xl bg-[#050505] px-4 py-4">
              <p className="text-xs font-medium text-white/60">
                Faturamento bruto
              </p>
              <p className="mt-3 text-xl font-semibold">
                {formatCurrency(summary?.totalGross)}
              </p>
              <p className="mt-3 text-[11px] text-white/45">
                Valor total das vendas aprovadas sem descontar taxas
              </p>
            </div>

            <div className="border border-[#151515] rounded-xl bg-[#050505] px-4 py-4">
              <p className="text-xs font-medium text-white/60">
                Faturamento líquido
              </p>
              <p className="mt-3 text-xl font-semibold">
                {formatCurrency(summary?.totalNet)}
              </p>
              <p className="mt-3 text-[11px] text-white/45">
                Após taxas de gateway, considerando apenas pedidos
                aprovados.
              </p>
            </div>

            <div className="border border-[#151515] rounded-xl bg-[#050505] px-4 py-4">
              <p className="text-xs font-medium text-white/60">
                Ticket médio
              </p>
              <p className="mt-3 text-xl font-semibold">
                {formatCurrency(summary?.averageTicket ?? 0)}
              </p>
              <p className="mt-3 text-[11px] text-white/45">
                Valor médio por pedido aprovado no período selecionado.
              </p>
            </div>

            <div className="border border-[#151515] rounded-xl bg-[#050505] px-4 py-4">
              <p className="text-xs font-medium text-white/60">
                Pedidos pagos
              </p>
              <p className="mt-3 text-xl font-semibold">
                {summary?.totalOrders ?? 0}
              </p>
              <p className="mt-3 text-[11px] text-white/45">
                Quantidade total de pedidos aprovados no dia selecionado.
              </p>
            </div>
          </section>

          {/* GRÁFICO PRINCIPAL */}
          <section className="border border-[#151515] rounded-xl bg-[#050505] px-7 py-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="pl-3 md:pl-3">
                <p className="text-[28px] md:text-[30px] font-semibold leading-tight">
                  {formatCurrency(summary?.totalNet)}
                </p>
                <p className="mt-0 text-[12px] text-white/65">
                  total balance
                </p>

                {intradayDelta && (
                  <div className="mt-6 flex items-center gap-2 text-[14px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] ${
                        intradayDelta.diff > 0
                          ? 'text-emerald-400'
                          : intradayDelta.diff < 0
                          ? 'text-red-400'
                          : 'text-white/60'
                      }`}
                    >
                      {intradayDelta.diff > 0 && (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                      {intradayDelta.diff < 0 && (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                      {intradayDelta.diff > 0 ? '+' : ''}
                      {formatCurrency(intradayDelta.diff)}
                      {intradayDelta.perc !== null && (
                        <span className="ml-1">
                          ({intradayDelta.perc > 0 ? '+' : ''}
                          {intradayDelta.perc.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="grossGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#e5e7eb"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="#e5e7eb"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#111111"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#6b7280',
                      dy: 20,
                    }}
                    minTickGap={8}
                    interval={0}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#6b7280',
                      dx: -30,
                    }}
                    width={70}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="totalNet"
                    stroke="#e5e7eb"
                    strokeWidth={2.4}
                    fill="url(#grossGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>
      </div>

      {/* animações do calendário */}
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
