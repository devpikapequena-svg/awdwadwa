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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const mainItem = payload.find((p: any) => p.dataKey === 'totalNet')
  const compareItem = payload.find(
    (p: any) => p.dataKey === 'compareTotalNet',
  )

  return (
    <div className="rounded-lg border border-[#151515] bg-[#050505] px-3 py-2 text-xs text-white/80">
      <p className="mb-1 text-[11px] text-white/60">{label}</p>

      {mainItem && (
        <p className="font-medium">
          Dia selecionado: {formatCurrency(mainItem.value)}
        </p>
      )}

      {compareItem && (
        <p className="mt-1 text-[11px] text-white/70">
          Comparado: {formatCurrency(compareItem.value)}
        </p>
      )}
    </div>
  )
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

  // data principal selecionada
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toYMD(new Date()),
  )

  // data de comparação (opcional)
  const [compareDate, setCompareDate] = useState<string | null>(null)

  // mês dos calendários
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [compareCalendarMonth, setCompareCalendarMonth] = useState<Date>(
    () => {
      const n = new Date()
      return new Date(n.getFullYear(), n.getMonth(), 1)
    },
  )

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarClosing, setCalendarClosing] = useState(false)
  const calendarRef = useRef<HTMLDivElement | null>(null)

  const [compareCalendarOpen, setCompareCalendarOpen] = useState(false)
  const [compareCalendarClosing, setCompareCalendarClosing] =
    useState(false)
  const compareCalendarRef = useRef<HTMLDivElement | null>(null)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [yesterdaySummary, setYesterdaySummary] =
    useState<DashboardSummary | null>(null)
  const [compareSummary, setCompareSummary] =
    useState<DashboardSummary | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)

  const todayDate = useMemo(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0)
  }, [])

  const isSelectedToday = useMemo(() => {
    const today = toYMD(new Date())
    return today === selectedDate
  }, [selectedDate])

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDate])

  const compareSelectedDateLabel = useMemo(() => {
    if (!compareDate) return null
    const d = new Date(compareDate + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [compareDate])

  // quando mudar selectedDate, garante que o calendário está no mesmo mês
  useEffect(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [selectedDate])

  // quando mudar compareDate, alinha mês do calendário de compare
  useEffect(() => {
    if (!compareDate) return
    const d = new Date(compareDate + 'T12:00:00')
    setCompareCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [compareDate])

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

  // clique fora do calendário principal
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

  // clique fora do calendário de comparação
  useEffect(() => {
    if (!compareCalendarOpen) return

    function handleClickOutside(ev: MouseEvent) {
      if (!compareCalendarRef.current) return
      if (!compareCalendarRef.current.contains(ev.target as Node)) {
        setCompareCalendarClosing(true)
        setTimeout(() => setCompareCalendarOpen(false), 160)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [compareCalendarOpen])

  // carregar dashboard da data selecionada + ontem (pra intraday)
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        const baseDate = new Date(selectedDate + 'T12:00:00')
        const prevDate = new Date(baseDate)
        prevDate.setDate(prevDate.getDate() - 1)

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

  // carregar dashboard da data de comparação (quando houver e for diferente da selecionada)
  useEffect(() => {
    if (!compareDate || compareDate === selectedDate) {
      setCompareSummary(null)
      return
    }

    async function loadCompare() {
      try {
        setLoadingCompare(true)

        const res = await fetch(
          `/api/dashboard/summary?period=today&referenceDate=${compareDate}`,
        )

        if (res.ok) {
          const data = await res.json()
          setCompareSummary(data)
        } else {
          setCompareSummary(null)
        }
      } catch (e) {
        console.error('Erro ao carregar comparação', e)
      } finally {
        setLoadingCompare(false)
      }
    }

    loadCompare()
  }, [compareDate, selectedDate])

  // ====== DIFERENÇA INTRADAY (selecionado hoje x ontem) ======
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

  // ====== CHART DATA COM 2 LINHAS (principal + comparado) ======
  const chartData = useMemo(() => {
    if (!summary) return []

    // sempre 00h–23h
    const byHourMain = new Map<number, DailyPoint>()
    summary.dailySeries.forEach((p) => {
      const d = new Date(p.date)
      const h = d.getHours()
      const existing = byHourMain.get(h)
      if (existing) {
        byHourMain.set(h, {
          ...existing,
          totalGross: existing.totalGross + p.totalGross,
          totalNet: existing.totalNet + p.totalNet,
          myCommission: existing.myCommission + p.myCommission,
          orders: existing.orders + p.orders,
        })
      } else {
        byHourMain.set(h, p)
      }
    })

    const byHourCompare = new Map<number, DailyPoint>()
    if (compareSummary) {
      compareSummary.dailySeries.forEach((p) => {
        const d = new Date(p.date)
        const h = d.getHours()
        const existing = byHourCompare.get(h)
        if (existing) {
          byHourCompare.set(h, {
            ...existing,
            totalGross: existing.totalGross + p.totalGross,
            totalNet: existing.totalNet + p.totalNet,
            myCommission: existing.myCommission + p.myCommission,
            orders: existing.orders + p.orders,
          })
        } else {
          byHourCompare.set(h, p)
        }
      })
    }

    const result = []
    for (let h = 0; h < 24; h++) {
      const pMain = byHourMain.get(h)
      const pCompare = byHourCompare.get(h)

      result.push({
        label: `${String(h).padStart(2, '0')}h`,
        totalNet: pMain?.totalNet ?? 0,
        compareTotalNet: pCompare?.totalNet ?? null,
      })
    }
    return result
  }, [summary, compareSummary])

  // ====== COMPARAÇÃO TOTAL DO DIA (quando tem compareDate diferente) ======
  const comparisonDelta = useMemo(() => {
    if (!summary || !compareSummary || !compareDate) return null
    if (compareDate === selectedDate) return null

    const mainTotal = summary.totalNet
    const compareTotal = compareSummary.totalNet

    const diff = mainTotal - compareTotal
    const perc = compareTotal > 0 ? (diff / compareTotal) * 100 : null

    return {
      mainTotal,
      compareTotal,
      diff,
      perc,
    }
  }, [summary, compareSummary, compareDate, selectedDate])

  // ====== CALENDÁRIOS ======
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

  const canGoNextCompareMonth = useMemo(() => {
    const cm = new Date(
      compareCalendarMonth.getFullYear(),
      compareCalendarMonth.getMonth(),
      1,
    )
    return cm < maxMonth
  }, [compareCalendarMonth, maxMonth])

  const weeks = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()

    const firstDayCurrent = new Date(year, month, 1)
    const firstWeekday = firstDayCurrent.getDay() // 0-dom ... 6-sab
    const daysInCurrent = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const matrix: CalendarCell[][] = []

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

  const compareWeeks = useMemo(() => {
    const year = compareCalendarMonth.getFullYear()
    const month = compareCalendarMonth.getMonth()

    const firstDayCurrent = new Date(year, month, 1)
    const firstWeekday = firstDayCurrent.getDay()
    const daysInCurrent = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const matrix: CalendarCell[][] = []

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
  }, [compareCalendarMonth])

  const handleSelectDay = (date: Date, isFuture: boolean) => {
    if (isFuture) return
    setSelectedDate(toYMD(date))
    setCalendarClosing(true)
    setTimeout(() => setCalendarOpen(false), 160)
  }

  const handleSelectCompareDay = (date: Date, isFuture: boolean) => {
    if (isFuture) return
    const chosen = toYMD(date)

    // se escolher o mesmo dia da data principal ou o mesmo dia já escolhido, limpa a comparação
    if (chosen === selectedDate || chosen === compareDate) {
      setCompareDate(null)
    } else {
      setCompareDate(chosen)
    }

    setCompareCalendarClosing(true)
    setTimeout(() => setCompareCalendarOpen(false), 160)
  }

  // ===== GUARD: enquanto carrega auth, só a bolinha =====
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#070707] text-white">
        {/* Sidebar */}
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

            {/* FILTROS DE DATA */}
            <div className="flex items-center gap-3">
              {/* Data principal */}
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
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/20 opacity-40 cursor-not-allowed'
                          } else if (isSelected) {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md bg-[#2b2b2b] text-white'
                          } else if (!inCurrentMonth) {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/35 hover:bg-white/5 transition-colors'
                          } else {
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

              {/* Data de comparação */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!compareCalendarOpen) {
                      setCompareCalendarOpen(true)
                      setCompareCalendarClosing(false)
                    } else {
                      setCompareCalendarClosing(true)
                      setTimeout(
                        () => setCompareCalendarOpen(false),
                        160,
                      )
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#151515] bg-[#050505] px-3 py-2 text-xs text-white/80 hover:bg-[#111111] transition-colors"
                >
                  <CalendarDays className="h-4 w-4 text-white/70" />
                  <span className="whitespace-nowrap">
                    {compareSelectedDateLabel || 'Comparar com...'}
                  </span>
                </button>

                {compareCalendarOpen && (
                  <div
                    ref={compareCalendarRef}
                    className={`absolute right-0 mt-2 w-72 rounded-xl border border-[#151515] bg-[#050505] shadow-xl z-30 origin-top-right ${
                      compareCalendarClosing
                        ? 'animate-scaleOut'
                        : 'animate-scaleIn'
                    }`}
                  >
                    {/* cabeçalho mês/ano */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <button
                        type="button"
                        onClick={() =>
                          setCompareCalendarMonth(
                            new Date(
                              compareCalendarMonth.getFullYear(),
                              compareCalendarMonth.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/5"
                      >
                        <ChevronLeft className="h-4 w-4 text-white/70" />
                      </button>
                      <span className="text-xs font-medium text-white/80">
                        {compareCalendarMonth.toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={!canGoNextCompareMonth}
                        onClick={() => {
                          if (!canGoNextCompareMonth) return
                          setCompareCalendarMonth(
                            new Date(
                              compareCalendarMonth.getFullYear(),
                              compareCalendarMonth.getMonth() + 1,
                              1,
                            ),
                          )
                        }}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                          canGoNextCompareMonth
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
                      {compareWeeks.map((week, wi) =>
                        week.map((cell, di) => {
                          const dateObj = cell.date
                          const current = toYMD(dateObj)
                          const isSelected = current === compareDate
                          const isFuture = dateObj > todayDate
                          const inCurrentMonth = cell.inCurrentMonth

                          let classes = ''

                          if (isFuture) {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/20 opacity-40 cursor-not-allowed'
                          } else if (isSelected) {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md bg-[#2b2b2b] text-white'
                          } else if (!inCurrentMonth) {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/35 hover:bg-white/5 transition-colors'
                          } else {
                            classes =
                              'flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:bg-white/5 transition-colors'
                          }

                          return (
                            <button
                              key={`${wi}-${di}`}
                              type="button"
                              onClick={() =>
                                handleSelectCompareDay(dateObj, isFuture)
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
                Após taxas de gateway, considerando apenas pedidos aprovados.
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

                {/* Se tiver dia de comparação ≠ dia principal: mostra comparação entre dias */}
                {compareDate &&
                compareDate !== selectedDate &&
                comparisonDelta ? (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-[14px]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] ${
                          comparisonDelta.diff > 0
                            ? 'text-emerald-400'
                            : comparisonDelta.diff < 0
                            ? 'text-red-400'
                            : 'text-white/60'
                        }`}
                      >
                        {comparisonDelta.diff > 0 && (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                        {comparisonDelta.diff < 0 && (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        {comparisonDelta.diff > 0 ? '+' : ''}
                        {formatCurrency(comparisonDelta.diff)}
                        {comparisonDelta.perc !== null && (
                          <span className="ml-1">
                            ({comparisonDelta.perc > 0 ? '+' : ''}
                            {comparisonDelta.perc.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    {compareSelectedDateLabel && (
                      <p className="mt-1 text-[11px] text-white/45">
                        Comparado com {compareSelectedDateLabel}
                      </p>
                    )}
                  </div>
                ) : (
                  // Senão, volta pro modo antigo: comparação intradiária hoje x ontem
                  intradayDelta && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 text-[14px]">
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
                    </div>
                  )
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

                  {/* Linha principal do dia selecionado */}
                  <Area
                    type="monotone"
                    dataKey="totalNet"
                    stroke="#e5e7eb"
                    strokeWidth={2.4}
                    fill="url(#grossGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  {/* Linha do dia comparado - mais escura e sem fill */}
                  <Area
                    type="monotone"
                    dataKey="compareTotalNet"
                    stroke="#4b5563"
                    strokeWidth={2}
                    fill="transparent"
                    dot={false}
                    activeDot={{ r: 3 }}
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
