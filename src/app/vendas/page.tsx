'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  CalendarDays,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react'

type StatusFilter = 'all' | 'paid' | 'pending' | 'med'

type Sale = {
  id: string
  siteName: string
  partnerName: string
  buckpayOrderId?: string | null
  amount: number
  netAmount: number
  myCommission: number
  status: 'paid' | 'pending' | 'med'
  paymentMethod: 'pix' | 'card' | 'boleto' | string
  source?: string | null
  campaign?: string | null
  createdAt: string
  customerName?: string | null
  gateway: 'buckpay' | 'blackcat' | string
}

type SalesSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
}

type VendasResponse = {
  summary: SalesSummary
  orders: Sale[]
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

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPaymentMethod(m: string) {
  const v = m.toLowerCase()
  if (v === 'pix') return 'Pix'
  if (v === 'card' || v === 'credit_card') return 'Cartão'
  if (v === 'boleto') return 'Boleto'
  return m
}

function statusLabel(s: 'paid' | 'pending' | 'med') {
  if (s === 'paid') return 'Pago'
  if (s === 'pending') return 'Pendente'
  return 'Mediação / Chargeback'
}

function statusClasses(s: 'paid' | 'pending' | 'med') {
  if (s === 'paid')
    return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
  if (s === 'pending')
    return 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
  return 'bg-red-500/10 text-red-300 border border-red-500/30'
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // YYYY-MM-DD em timezone local
}


type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

// 7 pedidos por página
const PAGE_SIZE = 7

export default function VendasPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // ===== DATA SELECIONADA (igual dashboard) =====
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toYMD(new Date()),
  )

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarClosing, setCalendarClosing] = useState(false)
  const calendarRef = useRef<HTMLDivElement | null>(null)

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

  // quando mudar selectedDate, sincroniza mês do calendário
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

  // fechar calendário clicando fora
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

  // ===== FILTROS =====
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')

  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [partnerMenuOpen, setPartnerMenuOpen] = useState(false)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [orders, setOrders] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)

  // ===== CARREGA VENDAS QUANDO MUDA A DATA (só com user) =====
  useEffect(() => {
    if (!user) return

    async function loadSales() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/vendas?period=today&referenceDate=${selectedDate}`,
        )
        if (!res.ok) {
          throw new Error('Erro ao carregar vendas')
        }

        const data: VendasResponse = await res.json()
        setSummary(data.summary)
        setOrders(data.orders)
        setCurrentPage(1)
      } catch (e: any) {
        console.error('Erro ao buscar vendas:', e)
        setError(e.message || 'Erro ao buscar vendas.')
        setSummary(null)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    loadSales()
  }, [selectedDate, user])

  // reset página ao mudar filtro/busca
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, partnerFilter, search])

  // ===== LISTA DE PARCEIROS (PARA FILTRO) =====
  const partnerOptions = useMemo(() => {
    const set = new Set<string>()
    orders.forEach((o) => {
      if (o.partnerName) set.add(o.partnerName)
    })
    return Array.from(set).sort()
  }, [orders])

  // ===== BASE FILTER (só parceiro + busca, SEM status) =====
  const baseFiltered = useMemo(() => {
    return orders.filter((o) => {
      if (partnerFilter !== 'all' && o.partnerName !== partnerFilter) {
        return false
      }

      if (search.trim()) {
        const term = search.trim().toLowerCase()
        const inCustomer =
          o.customerName?.toLowerCase().includes(term) ?? false
        const inSite = o.siteName.toLowerCase().includes(term)
        const inId = o.buckpayOrderId
          ? String(o.buckpayOrderId).toLowerCase().includes(term)
          : false
        return inCustomer || inSite || inId
      }

      return true
    })
  }, [orders, partnerFilter, search])

  // ===== FILTRAGEM LOCAL PARA TABELA (base + status) =====
  const filteredOrders = useMemo(() => {
    return baseFiltered.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [baseFiltered, statusFilter])

  // ===== SUMMARY PAID (cards principais) =====
  const paidSummary: SalesSummary = useMemo(() => {
    const paid = baseFiltered.filter((o) => o.status === 'paid')

    const totalOrders = paid.length
    const totalGross = paid.reduce((acc, o) => acc + (o.amount ?? 0), 0)
    const totalNet = paid.reduce((acc, o) => acc + (o.netAmount ?? 0), 0)
    const myCommissionTotal = paid.reduce(
      (acc, o) => acc + (o.myCommission ?? 0),
      0,
    )

    const averageTicket =
      totalOrders > 0 ? totalGross / totalOrders : null

    return {
      periodLabel: summary?.periodLabel ?? '',
      totalOrders,
      totalGross,
      totalNet,
      myCommissionTotal,
      averageTicket,
    }
  }, [baseFiltered, summary?.periodLabel])

  // ===== TOTAL PENDENTE (líquido) =====
  const pendingTotal = useMemo(() => {
    const pending = baseFiltered.filter((o) => o.status === 'pending')
    return pending.reduce(
      (acc, o) => acc + (o.netAmount ?? o.amount ?? 0),
      0,
    )
  }, [baseFiltered])

  // ===== CALENDÁRIO (mesmo do dashboard) =====
  const weeks = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()

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
  }, [calendarMonth])

  const handleSelectDay = (date: Date, isFuture: boolean) => {
    if (isFuture) return
    setSelectedDate(toYMD(date))
    setCalendarClosing(true)
    setTimeout(() => setCalendarOpen(false), 160)
  }

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

  // ===== PAGINAÇÃO =====
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE),
  )

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return filteredOrders.slice(start, end)
  }, [filteredOrders, currentPage])

  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const pagesToShow = useMemo(() => {
    const pages: number[] = []
    const maxToShow = 5

    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + maxToShow - 1)
    if (end - start + 1 < maxToShow) {
      start = Math.max(1, end - maxToShow + 1)
    }

    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }, [currentPage, totalPages])

  const statusFilterLabel = useMemo(() => {
    if (statusFilter === 'all') return 'Todos'
    if (statusFilter === 'paid') return 'Pagos'
    if (statusFilter === 'pending') return 'Pendentes'
    return 'Mediação / Chargeback'
  }, [statusFilter])

  const partnerFilterLabel = useMemo(() => {
    if (partnerFilter === 'all') return 'Todos os parceiros'
    return partnerFilter
  }, [partnerFilter])

  // ===== GUARD: enquanto carrega auth, só a bolinha =====
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      {/* SIDEBAR FIXO */}
      <Sidebar
        user={
          user || {
            id: '',
            name: '',
            email: '',
          }
        }
      />

      {/* CONTEÚDO COM ESPAÇO PRO SIDEBAR NO DESKTOP */}
      <main className="px-6 py-8 md:px-10 md:py-10 md:ml-64">
        {/* HEADER TOP */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-2 text-[24px] md:text-[26px] font-semibold">
              Vendas & pedidos
            </h1>
            <p className="mt-1 text-xs text-white/45 max-w-md">
              Acompanhe todas as vendas por data, status e parceiro, com visão
              detalhada de cada pedido.
            </p>
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
          </div>
        </header>

        {/* CARDS DE RESUMO */}
        <section className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl">
            <p className="text-xs font-medium text-white/60">
              Pagamentos pendentes
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(pendingTotal)}
            </p>
            <p className="mt-2 text-[11px] text-white/45">
              Valor líquido aguardando confirmação de pagamento.
            </p>
          </div>
          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl">
            <p className="text-xs font-medium text-white/60">
              Faturamento bruto
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(paidSummary.totalGross)}
            </p>
            <p className="mt-2 text-[11px] text-white/45">
              Valor bruto das vendas pagas no dia.
            </p>
          </div>

          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl">
            <p className="text-xs font-medium text-white/60">
              Faturamento líquido
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(paidSummary.totalNet)}
            </p>
            <p className="mt-2 text-[11px] text-white/45">
              Após taxas de gateway nas vendas pagas.
            </p>
          </div>

          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl">
            <p className="text-xs font-medium text-white/60">
              Vendas no dia
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {paidSummary.totalOrders}
            </p>
            <p className="mt-2 text-[11px] text-white/45">
              Pedidos pagos em {selectedDateLabel}.
            </p>
          </div>
        </section>

        {/* CARD PRINCIPAL: FILTROS + TABELA */}
        <section className="border border-[#151515] bg-[#050505] rounded-xl px-6 py-5 space-y-6">
          {/* TOPO: FILTROS */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
                  <Filter className="h-3.5 w-3.5 text-white/70" />
                </span>
                Filtros de vendas
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                Mostrando{' '}
                <span className="text-white/80 font-medium">
                  {paginatedOrders.length}
                </span>{' '}
                de{' '}
                <span className="text-white/60">
                  {filteredOrders.length}
                </span>{' '}
                vendas filtradas.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              {/* Status - DROPDOWN CUSTOM */}
              <div className="flex flex-col gap-1 min-w-[180px]">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.18em]">
                  Status
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMenuOpen((v) => !v)
                      setPartnerMenuOpen(false)
                    }}
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-[#151515] bg-[#070707] px-3 text-xs text-white/80 hover:bg-[#101010] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg_WHITE/40" />
                      <span className="truncate">{statusFilterLabel}</span>
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-white/50 transition-transform ${
                        statusMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {statusMenuOpen && (
                    <div className="absolute right-0 mt-1 w-56 rounded-xl border border-[#151515] bg-[#050505] shadow-xl z-20 py-1">
                      {[
                        { value: 'all', label: 'Todos' },
                        { value: 'paid', label: 'Pagos' },
                        { value: 'pending', label: 'Pendentes' },
                        {
                          value: 'med',
                          label: 'Mediação / Chargeback',
                        },
                      ].map((opt) => {
                        const active = statusFilter === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setStatusFilter(opt.value as StatusFilter)
                              setStatusMenuOpen(false)
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-[11px] text-left ${
                              active
                                ? 'bg-white/5 text-white'
                                : 'text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {active && (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Parceiro - DROPDOWN CUSTOM */}
              <div className="flex flex-col gap-1 min-w-[220px]">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.18em]">
                  Parceiro
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerMenuOpen((v) => !v)
                      setStatusMenuOpen(false)
                    }}
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-[#151515] bg-[#070707] px-3 text-xs text-white/80 hover:bg-[#101010] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="truncate">{partnerFilterLabel}</span>
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-white/50 transition-transform ${
                        partnerMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {partnerMenuOpen && (
                    <div className="absolute right-0 mt-1 w-64 max-h-72 overflow-y-auto rounded-xl border border-[#151515] bg-[#050505] shadow-xl z-20 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPartnerFilter('all')
                          setPartnerMenuOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-[11px] text-left ${
                          partnerFilter === 'all'
                            ? 'bg-white/5 text-white'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <span>Todos os parceiros</span>
                        {partnerFilter === 'all' && (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>

                      {partnerOptions.map((p) => {
                        const active = partnerFilter === p
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPartnerFilter(p)
                              setPartnerMenuOpen(false)
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-[11px] text-left ${
                              active
                                ? 'bg-white/5 text-white'
                                : 'text-white/70 hover:bg_WHITE/5'
                            }`}
                          >
                            <span className="truncate">{p}</span>
                            {active && (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Busca */}
              <div className="flex flex-col gap-1 min-w-[220px]">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.18em]">
                  Buscar
                </span>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-[#151515] bg-[#070707] px-3">
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cliente, ID, site..."
                    className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE VENDAS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#151515]">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full table-fixed text-xs">
                <thead className="bg-[#070707]/90 border-b border-[#151515] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[11%]">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-white/50 w-[22%]">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left font-medium text_WHITE/50 w-[22%]">
                      Site / Parceiro
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[10%]">
                      Bruto
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[10%]">
                      Líquido
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[13%]">
                      Pagamento
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-[11px] text-white/40"
                      >
                        Carregando vendas...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-[11px] text-white/40"
                      >
                        Nenhuma venda encontrada com os filtros atuais.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-[#151515] hover:bg-[#101010] transition-colors"
                      >
                        <td className="px-4 py-3 align-middle text-center text-white/70 whitespace-nowrap">
                          {formatDateTime(o.createdAt)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-white/80">
                              {o.customerName || 'Sem nome'}
                            </span>
                            {o.buckpayOrderId && (
                              <span className="text-[10px] text-white/35 break-all">
                                #{o.buckpayOrderId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-white/80">
                              {o.siteName}
                            </span>
                            <span className="text-[10px] text-white/35">
                              {o.partnerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-center text-white/80 whitespace-nowrap">
                          {formatCurrency(o.amount)}
                        </td>
                        <td className="px-4 py-3 align-middle text-center text-white/80 whitespace-nowrap">
                          {formatCurrency(o.netAmount)}
                        </td>
                        <td className="px-4 py-3 align-middle text-center text-white/70">
                          <div className="flex flex-col items-center">
                            <span className="text-xs">
                              {formatPaymentMethod(o.paymentMethod)}
                            </span>
                            <span className="text-[10px] text-white/35">
                              {o.gateway === 'buckpay'
                                ? 'BuckPay'
                                : o.gateway === 'blackcat'
                                ? 'BlackCat'
                                : o.gateway}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-2 py-[3px] text-[10px] ${statusClasses(
                              o.status,
                            )}`}
                          >
                            {statusLabel(o.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {!loading && filteredOrders.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#151515] px-4 py-3 text-[11px] text-white/50">
                <div>
                  Página{' '}
                  <span className="text-white/80 font-medium">
                    {currentPage}
                  </span>{' '}
                  de{' '}
                  <span className="text-white/80 font-medium">
                    {totalPages}
                  </span>{' '}
                  ·{' '}
                  <span className="text-white/60">
                    {filteredOrders.length} vendas
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => canPrev && setCurrentPage((p) => p - 1)}
                    disabled={!canPrev}
                    className={`px-2 py-1 rounded-md border border-[#151515] text-[11px] ${
                      canPrev
                        ? 'hover:bg-white/5 text-white/80'
                        : 'opacity-40 cursor-not-allowed text-white/40'
                    }`}
                  >
                    Anterior
                  </button>

                  {pagesToShow.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`h-7 min-w-[28px] rounded-md border text-[11px] ${
                        p === currentPage
                          ? 'bg-white text-black border-white'
                          : 'border-[#151515] text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => canNext && setCurrentPage((p) => p + 1)}
                    disabled={!canNext}
                    className={`px-2 py-1 rounded-md border border-[#151515] text-[11px] ${
                      canNext
                        ? 'hover:bg-white/5 text-white/80'
                        : 'opacity-40 cursor-not-allowed text-white/40'
                    }`}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-400/80">
              {error}
            </p>
          )}
        </section>
      </main>

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
    </div>
  )
}
