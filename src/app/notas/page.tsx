// src/app/comissoes/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  Wallet2,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: string
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
  siteName: string
  siteSlug: string

  totalGross: number
  totalNet: number

  totalNetBeforeAds?: number
  adsTotal?: number

  myCommission: number
  totalPaid: number
  balance: number
  payments: PartnerPaymentRow[]
}

type NotasResponse = {
  partners: PartnerRow[]
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
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // YYYY-MM-DD em timezone local
}

/* ===== tipos do calendário ===== */
type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

export default function ComissoesPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // ====== DATA SELECIONADA / CALENDÁRIO (MESMA LÓGICA DO DASHBOARD) ======
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

  // quando mudar selectedDate, garantir mês correto no calendário
  useEffect(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [selectedDate])

  // clique fora do calendário fecha com animação
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

    // primeira semana
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

    // semanas seguintes
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

  const handleSelectDay = (date: Date, isFuture: boolean) => {
    if (isFuture) return
    setSelectedDate(toYMD(date))
    setCalendarClosing(true)
    setTimeout(() => setCalendarOpen(false), 160)
  }

  // ===== STATE DE COMISSÕES =====
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  )

  // modal recebimento
  const [repasseOpen, setRepasseOpen] = useState(false)
  const [repasseClosing, setRepasseClosing] = useState(false)
  const [repassePartner, setRepassePartner] = useState<PartnerRow | null>(null)

  const [repasseDate, setRepasseDate] = useState<string>(selectedDate)
  const [repasseAmount, setRepasseAmount] = useState<string>('')
  const [repasseNote, setRepasseNote] = useState<string>('')
  const [repasseSaving, setRepasseSaving] = useState(false)
  const [repasseError, setRepasseError] = useState<string | null>(null)

  // ===== USER / AUTH GUARD =====
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

  // ===== LOAD PARTNERS / COMISSÕES (AGORA POR DIA DO CALENDÁRIO) =====
  useEffect(() => {
    async function loadNotas() {
      try {
        setLoading(true)
        setError(null)

        // sempre period=today, mas com referenceDate da data selecionada
        const res = await fetch(
          `/api/notas?period=today&referenceDate=${selectedDate}`,
          {
            credentials: 'include',
          },
        )

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace('/login')
            return
          }
          throw new Error('Erro ao carregar comissões a receber.')
        }

        const data: NotasResponse = await res.json()
        setPartners(data.partners || [])

        if (!selectedPartnerId && data.partners && data.partners.length > 0) {
          setSelectedPartnerId(data.partners[0].partnerId)
        } else if (
          selectedPartnerId &&
          !(data.partners || []).some((p) => p.partnerId === selectedPartnerId)
        ) {
          if (data.partners && data.partners.length > 0) {
            setSelectedPartnerId(data.partners[0].partnerId)
          } else {
            setSelectedPartnerId(null)
          }
        }
      } catch (e: any) {
        console.error(e)
        setError(e.message || 'Erro ao carregar comissões a receber.')
        setPartners([])
      } finally {
        setLoading(false)
      }
    }

    if (!loadingUser) {
      loadNotas()
    }
  }, [selectedDate, selectedPartnerId, router, loadingUser])

  const selectedPartner = useMemo(
    () => partners.find((p) => p.partnerId === selectedPartnerId) || null,
    [partners, selectedPartnerId],
  )

  // ===== AGREGADOS GERAIS =====
  const totals = useMemo(() => {
    if (!partners.length) {
      return {
        totalCommission: 0,
        totalPaid: 0,
        totalBalance: 0,
      }
    }

    return {
      totalCommission: partners.reduce(
        (acc, p) => acc + (p.myCommission || 0),
        0,
      ),
      totalPaid: partners.reduce((acc, p) => acc + (p.totalPaid || 0), 0),
      totalBalance: partners.reduce((acc, p) => acc + (p.balance || 0), 0),
    }
  }, [partners])

  // ===== HANDLERS RECEBIMENTO =====
  const handleOpenRepasseModal = (partner: PartnerRow) => {
    setRepassePartner(partner)
    // data do recebimento = data que está selecionada no calendário
    setRepasseDate(selectedDate)
    setRepasseAmount('')
    setRepasseNote('')
    setRepasseError(null)
    setRepasseSaving(false)
    setRepasseOpen(true)
    setRepasseClosing(false)
  }

  const handleCloseRepasseModal = () => {
    setRepasseClosing(true)
    setTimeout(() => {
      setRepasseOpen(false)
      setRepassePartner(null)
    }, 160)
  }

  async function handleSubmitRepasse(e: React.FormEvent) {
    e.preventDefault()
    if (!repassePartner) return

    setRepasseError(null)

    const raw = repasseAmount.replace('.', '').replace(',', '.')
    const amount = Number(raw)

    if (!amount || amount <= 0) {
      setRepasseError('Informe um valor maior que zero.')
      return
    }

    try {
      setRepasseSaving(true)

      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          partnerId: repassePartner.partnerId,
          amount,
          note: repasseNote || '',
          repDate: repasseDate, // <-- DATA VINDO DO CALENDÁRIO
        }),
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace('/login')
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao registrar recebimento.')
      }

      const created = await res.json()

      const payment: PartnerPaymentRow = {
        id: String(created._id || created.id || ''),
        amount: created.amount,
        note: created.note || '',
        createdAt: created.createdAt || new Date().toISOString(),
      }

      setPartners((prev) =>
        prev.map((p) => {
          if (p.partnerId !== repassePartner.partnerId) return p

          const newTotalPaid = Number((p.totalPaid + payment.amount).toFixed(2))
          const newBalance = Number(
            (p.myCommission - newTotalPaid).toFixed(2),
          )

          return {
            ...p,
            totalPaid: newTotalPaid,
            balance: newBalance,
            payments: [payment, ...(p.payments || [])],
          }
        }),
      )

      handleCloseRepasseModal()
    } catch (err: any) {
      console.error(err)
      setRepasseError(err.message || 'Erro ao registrar recebimento.')
    } finally {
      setRepasseSaving(false)
    }
  }

  // ===== GUARD: enquanto carrega auth =====
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#070707] text-white">
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
          {/* HEADER */}
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-2 text-[24px] md:text-[26px] font-semibold">
                Comissões a receber
              </h1>
              <p className="mt-1 text-xs text-white/45 max-w-md">
                Veja quanto cada parceiro já te gerou de comissão, quanto já foi
                pago para você e o saldo que ainda falta receber, considerando o
                líquido já descontando os gastos com anúncio.
              </p>
            </div>

            {/* FILTRO DE DATA (MESMO CALENDÁRIO DO DASHBOARD) */}
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

          {/* CARDS RESUMO GERAL */}
          <section className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
              <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                <Wallet2 className="h-4 w-4 text-white/80" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/60">
                  Comissões geradas no dia
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrency(totals.totalCommission)}
                </p>
                <p className="mt-2 text-[11px] text-white/45">
                  Soma de 30% do faturamento líquido já descontando os gastos de
                  anúncio na data selecionada.
                </p>
              </div>
            </div>

            <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
              <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                <Banknote className="h-4 w-4 text-white/80" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/60">
                  Total já recebido
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrency(totals.totalPaid)}
                </p>
                <p className="mt-2 text-[11px] text-white/45">
                  Valor que os parceiros já te pagaram (pagamentos cadastrados)
                  na data filtrada.
                </p>
              </div>
            </div>

            <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
              <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                <ArrowUpRight className="h-4 w-4 text-white/80" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/60">
                  Saldo em aberto a receber
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrency(totals.totalBalance)}
                </p>
                <p className="mt-2 text-[11px] text-white/45">
                  O que ainda falta cair na sua conta, considerando tudo que já
                  foi recebido.
                </p>
              </div>
            </div>
          </section>

          {/* GRID PRINCIPAL: PARCEIROS + DETALHES */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {/* LISTA DE PARCEIROS */}
            <div className="border border-[#151515] bg-[#050505] rounded-xl px-6 py-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Visão por parceiro
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {partners.length} parceiro(s) com comissões geradas na data
                    selecionada.
                  </p>
                </div>
              </div>

              <div className="mt-2 overflow-hidden rounded-xl border border-[#151515]">
                <div className="max-h-[460px] overflow-auto">
                  <table className="min-w-full table-fixed text-xs">
                    <thead className="bg-[#070707]/90 border-b border-[#151515] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-white/50 w-[26%]">
                          Parceiro / Site
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                          Líquido
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                          Pós gasto
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                          Comissão
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                          Recebido
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-white/50 w-[12%]">
                          Em aberto
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-white/50 w-[14%]">
                          Ações
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
                            Carregando comissões...
                          </td>
                        </tr>
                      )}

                      {!loading && partners.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-[11px] text-white/40"
                          >
                            Nenhum dado encontrado para a data selecionada.
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        partners.map((p) => {
                          const isSelected = selectedPartnerId === p.partnerId

                          return (
                            <tr
                              key={p.partnerId}
                              className={`border-t border-[#151515] transition-colors ${
                                isSelected
                                  ? 'bg-[#101010]'
                                  : 'hover:bg-[#0c0c0c]'
                              }`}
                              onClick={() =>
                                setSelectedPartnerId(p.partnerId)
                              }
                            >
                              <td className="px-4 py-3 align-middle cursor-pointer">
                                <div className="flex flex-col">
                                  <span className="text-white/85 text-[12px] font-medium">
                                    {p.partnerName || 'Sem nome'}
                                  </span>
                                  <span className="text-[10px] text-white/40">
                                    {p.siteName}{' '}
                                    <span className="text-white/30">
                                      · {p.siteSlug}
                                    </span>
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center align-middle text-white/75 whitespace-nowrap">
                                {formatCurrency(
                                  p.totalNetBeforeAds ?? p.totalNet ?? 0,
                                )}
                              </td>
                              <td className="px-4 py-3 text-center align-middle text-white/75 whitespace-nowrap">
                                {formatCurrency(p.totalNet)}
                              </td>

                              <td className="px-4 py-3 text-center align-middle text-white/80 whitespace-nowrap">
                                {formatCurrency(p.myCommission)}
                              </td>
                              <td className="px-4 py-3 text-center align-middle text-white/70 whitespace-nowrap">
                                {formatCurrency(p.totalPaid)}
                              </td>
                              <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] ${
                                    p.balance > 0
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                      : p.balance < 0
                                      ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                      : 'bg-white/5 text-white/70 border border-white/10'
                                  }`}
                                >
                                  {formatCurrency(p.balance)}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle text-right">
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    handleOpenRepasseModal(p)
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/85 hover:bg-white/10"
                                >
                                  Registrar
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-400/80">{error}</p>
              )}
            </div>

            {/* DETALHES DO PARCEIRO SELECIONADO */}
            <div className="border border-[#151515] bg-[#050505] rounded-xl px-6 py-5 space-y-4">
              {selectedPartner ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Detalhes do parceiro
                      </p>
                      <p className="mt-1 text-[11px] text-white/45">
                        {selectedPartner.partnerName || 'Sem nome'} ·{' '}
                        {selectedPartner.siteName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenRepasseModal(selectedPartner)}
                      className="inline-flex items-center justify-center rounded-lg bg-white text-black px-3 py-1.5 text-[11px] font-medium hover:bg-white/90"
                    >
                      Registrar recebimento
                    </button>
                  </div>

                  {/* RESUMO DO PARCEIRO */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#151515] bg-[#070707] px-3 py-3">
                      <p className="text-[11px] text-white/45">
                        Comissão gerada no dia
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(selectedPartner.myCommission)}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">
                        30% sobre o faturamento líquido já descontando os
                        gastos de anúncio desse parceiro na data filtrada.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#151515] bg-[#070707] px-3 py-3">
                      <p className="text-[11px] text-white/45">
                        Total já recebido
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(selectedPartner.totalPaid)}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">
                        Pagamentos que esse parceiro já te fez (lancados em
                        qualquer dia, mas filtrados por data).
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#151515] bg-[#070707] px-3 py-3 md:col-span-2">
                      <p className="text-[11px] text-white/45">
                        Saldo em aberto a receber
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(selectedPartner.balance)}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">
                        Comissão gerada menos o que já foi pago pra você. O
                        faturamento líquido aqui já considera os gastos de
                        anúncio lançados para esse parceiro.
                      </p>
                    </div>
                  </div>

                  {/* HISTÓRICO DE RECEBIMENTOS */}
                  <div className="mt-4">
                    <p className="text-[12px] font-medium text-white/80 mb-2">
                      Histórico de recebimentos
                    </p>

                    <div className="overflow-hidden rounded-xl border border-[#151515]">
                      <div className="max-h-[260px] overflow-auto">
                        <table className="min-w-full text-[11px]">
                          <thead className="bg-[#070707]/90 border-b border-[#151515] sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-white/50 w-[35%]">
                                Data
                              </th>
                              <th className="px-4 py-2 text-center font-medium text-white/50 w-[25%]">
                                Valor recebido
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-white/50 w-[40%]">
                                Observação
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPartner.payments &&
                            selectedPartner.payments.length > 0 ? (
                              selectedPartner.payments
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime(),
                                )
                                .map((pg) => (
                                  <tr
                                    key={pg.id}
                                    className="border-t border-[#151515] hover:bg-[#101010] transition-colors"
                                  >
                                    <td className="px-4 py-2 align-middle text-white/70 whitespace-nowrap">
                                      {formatDateTime(pg.createdAt)}
                                    </td>
                                    <td className="px-4 py-2 align-middle text-center text-white/80 whitespace-nowrap">
                                      {formatCurrency(pg.amount)}
                                    </td>
                                    <td className="px-4 py-2 align-middle text-white/70">
                                      {pg.note ? (
                                        <span>{pg.note}</span>
                                      ) : (
                                        <span className="text-white/35">
                                          — sem observações
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-5 text-center text-white/40"
                                >
                                  Nenhum recebimento registrado para este
                                  parceiro ainda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center gap-2">
                  <p className="text-sm font-medium text-white/80">
                    Selecione um parceiro na lista ao lado
                  </p>
                  <p className="text-[11px] text-white/45 max-w-xs">
                    Escolha um parceiro para ver as comissões que ele te deve, o
                    que já foi pago e o saldo em aberto.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* MODAL REGISTRAR RECEBIMENTO */}
      {repasseOpen && repassePartner && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border border-[#202020] bg-[#050505] shadow-2xl px-6 py-5 relative ${
              repasseClosing ? 'animate-scaleOut' : 'animate-scaleIn'
            }`}
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={handleCloseRepasseModal}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="mb-4">
              <p className="text-sm font-medium text-white/85 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                  <Banknote className="h-3.5 w-3.5 text-white/80" />
                </span>
                Registrar recebimento
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                Pagamento vindo de{' '}
                {repassePartner.partnerName || 'parceiro sem nome'} ·{' '}
                {repassePartner.siteName}
              </p>
            </div>

            <form onSubmit={handleSubmitRepasse} className="space-y-4">
              {/* DATA - já vem do calendário, mas continua editável se quiser mudar */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/50">
                  Data do recebimento
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <CalendarDays className="h-4 w-4 text-white/40" />
                  </span>
                  <input
                    type="date"
                    value={repasseDate}
                    onChange={(e) => setRepasseDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#151515] bg-[#070707] pl-9 pr-3 text-xs text-white/80 outline-none focus:border-white/30"
                  />
                </div>
                <p className="text-[10px] text-white/35">
                  Por padrão usamos a data selecionada no calendário. Altere se
                  o pagamento foi em outro dia.
                </p>
              </div>

              {/* VALOR */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/50">
                  Valor recebido (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 1.250,00"
                  value={repasseAmount}
                  onChange={(e) => setRepasseAmount(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#151515] bg-[#070707] px-3 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/30"
                />
              </div>

              {/* OBS */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/50">
                  Observação (opcional)
                </label>
                <textarea
                  rows={3}
                  value={repasseNote}
                  onChange={(e) => setRepasseNote(e.target.value)}
                  placeholder="Ex: Pix recebido, ref. fechamento de 05/2025, nota 123..."
                  className="w-full rounded-lg border border-[#151515] bg-[#070707] px-3 py-2 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/30 resize-none"
                />
              </div>

              {repasseError && (
                <p className="text-[11px] text-red-400/80">
                  {repasseError}
                </p>
              )}

              <div className="mt-1 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseRepasseModal}
                  className="inline-flex items-center justify-center rounded-lg border border-[#202020] bg-transparent px-3 py-2 text-[11px] text-white/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={repasseSaving}
                  className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-[11px] font-medium hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {repasseSaving ? 'Salvando...' : 'Confirmar recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* animações */}
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
