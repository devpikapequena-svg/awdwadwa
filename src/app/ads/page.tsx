// src/app/ads/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet2,
  BarChart3,
  Plus,
} from 'lucide-react'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: string
}

type AdType = 'ad' | 'med'

type AdItem = {
  _id: string
  siteSlug: string
  siteName: string
  refDate: string
  amount: number
  notes: string | null
  createdAt: string
  type: AdType
}

type AdsResponse = {
  refDate: string
  totalSpent: number
  items: AdItem[]
}

type AdsSite = {
  siteSlug: string
  siteName: string
  partnerName: string
  domain: string
}

type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

/* =============== LOADER FULLSCREEN =============== */

function FullscreenLoader() {
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

/* ================================================= */

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number | null | undefined) {
  if (value == null) return 'R$ 0,00'
  return currency.format(value)
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // YYYY-MM-DD em timezone local
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

// 🔹 nova função: formata a refDate (dia do gasto)
function formatRefDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T12:00:00') // evita bug de fuso
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function typeLabel(t: AdType) {
  return t === 'ad' ? 'Anúncio' : 'MED'
}

function typeClasses(t: AdType) {
  if (t === 'ad') {
    return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
  }
  return 'bg-violet-500/10 text-violet-300 border border-violet-500/30'
}

export default function AdsPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // ===== DATA SELECIONADA =====
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

  // sincroniza mês do calendário quando trocar a data
  useEffect(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [selectedDate])

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

  // ===== ADS DATA =====
  const [adsSummary, setAdsSummary] = useState<AdsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // lista de sites para o formulário
  const [sites, setSites] = useState<AdsSite[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)

  // modal novo gasto
  const [modalOpen, setModalOpen] = useState(false)

  // form de novo gasto
  const [siteSlugInput, setSiteSlugInput] = useState<string>('')
  const [amountInput, setAmountInput] = useState<string>('')
  const [notesInput, setNotesInput] = useState<string>('')
  const [expenseType, setExpenseType] = useState<AdType>('ad')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // dropdown custom de site
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)
  const siteDropdownRef = useRef<HTMLDivElement | null>(null)

  // dropdown tipo de gasto
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement | null>(null)

  // fechar dropdown de site clicando fora
  useEffect(() => {
    if (!siteDropdownOpen) return

    function handleClickOutside(ev: MouseEvent) {
      if (!siteDropdownRef.current) return
      if (!siteDropdownRef.current.contains(ev.target as Node)) {
        setSiteDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [siteDropdownOpen])

  // fechar dropdown de tipo clicando fora
  useEffect(() => {
    if (!typeDropdownOpen) return

    function handleClickOutside(ev: MouseEvent) {
      if (!typeDropdownRef.current) return
      if (!typeDropdownRef.current.contains(ev.target as Node)) {
        setTypeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [typeDropdownOpen])

  // ===== CARREGA GASTOS DA DATA =====
  useEffect(() => {
    async function loadAds() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ads?date=${selectedDate}`, {
          credentials: 'include',
        })

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace('/login')
            return
          }
          throw new Error('Erro ao carregar gastos de anúncio / MED.')
        }
        const data: AdsResponse = await res.json()
        setAdsSummary(data)
      } catch (e: any) {
        console.error('Erro ao buscar gastos:', e)
        setError(e.message || 'Erro ao buscar gastos de anúncio / MED.')
        setAdsSummary(null)
      } finally {
        setLoading(false)
      }
    }

    // só busca depois do user
    if (!loadingUser) {
      loadAds()
    }
  }, [selectedDate, router, loadingUser])

  // ===== CARREGA SITES =====
  useEffect(() => {
    async function loadSites() {
      try {
        setSitesLoading(true)
        const res = await fetch('/api/ads/sites', {
          credentials: 'include',
        })

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace('/login')
          }
          return
        }
        const data = await res.json()
        setSites(data.items || [])
      } catch (e) {
        console.error('Erro ao carregar sites para gastos', e)
      } finally {
        setSitesLoading(false)
      }
    }

    if (!loadingUser) {
      loadSites()
    }
  }, [router, loadingUser])

  // ===== CALENDÁRIO =====
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

  // ===== FORM SUBMIT =====
  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!siteSlugInput) {
      setFormError('Selecione um site.')
      return
    }

    const raw = amountInput.replace('.', '').replace(',', '.')
    const amount = Number(raw)

    if (!amount || amount <= 0) {
      setFormError('Informe um valor maior que zero.')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          refDate: selectedDate,
          siteSlug: siteSlugInput,
          amount,
          notes: notesInput || null,
          type: expenseType,
        }),
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace('/login')
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data.error || 'Erro ao salvar gasto de anúncio / MED.',
        )
      }

      const created: AdItem = await res.json()

      // atualiza lista e total (soma tudo, anúncio + MED)
      setAdsSummary((prev) => {
        if (!prev) {
          return {
            refDate: selectedDate,
            totalSpent: created.amount,
            items: [created],
          }
        }
        return {
          ...prev,
          totalSpent: Number((prev.totalSpent + created.amount).toFixed(2)),
          items: [created, ...prev.items],
        }
      })

      setAmountInput('')
      setNotesInput('')
      setFormSuccess('Gasto registrado com sucesso.')
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Erro ao salvar gasto de anúncio / MED.')
    } finally {
      setSaving(false)
    }
  }

  const selectedSite = useMemo(
    () => sites.find((s) => s.siteSlug === siteSlugInput),
    [sites, siteSlugInput],
  )

  // ===== GUARD: enquanto carrega auth, só o loader =====
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
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
              Gastos de anúncio e MED
            </h1>
            <p className="mt-1 text-xs text-white/45 max-w-md">
              Registre e acompanhe tudo que está sendo movimentado em anúncios
              e MED (reembolsos / ajustes) por site, com visão diária
              centralizada.
            </p>
          </div>

          {/* DATA */}
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

        {/* CARDS RESUMO */}
        <section className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
            <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <Wallet2 className="h-4 w-4 text-white/80" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/60">
                Total em anúncio + MED
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {formatCurrency(adsSummary?.totalSpent ?? 0)}
              </p>
              <p className="mt-2 text-[11px] text-white/45">
                Somatório de todos os lançamentos de anúncio e MED em{' '}
                {selectedDateLabel}.
              </p>
            </div>
          </div>

          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
            <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <BarChart3 className="h-4 w-4 text-white/80" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/60">
                Registros do dia
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {adsSummary?.items.length ?? 0}
              </p>
              <p className="mt-2 text-[11px] text-white/45">
                Quantidade de lançamentos de anúncio ou MED cadastrados
                para a data selecionada.
              </p>
            </div>
          </div>

          <div className="border border-[#151515] bg-[#050505] px-4 py-4 rounded-xl flex items-start gap-3">
            <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <Plus className="h-4 w-4 text-white/80" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/60">
                Controle manual
              </p>
              <p className="mt-3 text-sm font-semibold text-white/80">
                Registre manualmente anúncios pagos e MED (reembolsos,
                ajustes) para ter visão real do resultado no dashboard.
              </p>
              <p className="mt-2 text-[11px] text-white/45">
                Você pode lançar valores por site, separar o tipo de gasto
                e adicionar observações.
              </p>
            </div>
          </div>
        </section>

        {/* LISTA + BOTÃO NOVO GASTO (modal) */}
        <section className="w-full border border-[#151515] bg-[#050505] rounded-xl px-6 py-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                Lançamentos do dia
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                {adsSummary?.items.length ?? 0} registro(s) de anúncio ou
                MED em {selectedDateLabel}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setFormSuccess(null)
                setModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-xs font-medium hover:bg-white/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo gasto
            </button>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-[#151515]">
            <div className="max-h-[460px] overflow-auto">
              <table className="min-w-full table-fixed text-xs">
                <thead className="bg-[#070707]/90 border-b border-[#151515] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[18%]">
                      Dia do gasto
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-white/50 w-[30%]">
                      Site
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[14%]">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-white/50 w-[16%]">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-white/50 w-[22%]">
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-[11px] text-white/40"
                      >
                        Carregando lançamentos...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    (!adsSummary || adsSummary.items.length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-[11px] text-white/40"
                        >
                          Nenhum gasto de anúncio ou MED registrado para
                          esta data.
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    adsSummary &&
                    adsSummary.items.map((item) => (
                      <tr
                        key={item._id}
                        className="border-t border-[#151515] hover:bg-[#101010] transition-colors"
                      >
                        <td className="px-4 py-3 text-center align-middle text-white/70 whitespace-nowrap">
                          {formatRefDate(item.refDate)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-white/80">
                              {item.siteName}
                            </span>
                            <span className="text-[10px] text-white/35">
                              {item.siteSlug}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] ${typeClasses(
                              item.type,
                            )}`}
                          >
                            {typeLabel(item.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center align-middle text-white/80 whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-3 align-middle text-white/70">
                          {item.notes ? (
                            <span className="text-[11px]">
                              {item.notes}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/35">
                              — sem observações
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-400/80">{error}</p>
          )}
        </section>
      </main>

      {/* MODAL NOVO GASTO (estilo página notas) */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#202020] bg-[#050505] px-6 py-5 shadow-2xl animate-scaleIn">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                    <Plus className="h-3.5 w-3.5 text-white/80" />
                  </span>
                  Novo gasto (anúncio ou MED)
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Lançamento será salvo para{' '}
                  <span className="font-medium text-white/75">
                    {selectedDateLabel}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="mt-4 space-y-4">
              {/* tipo de gasto */}
              <div className="space-y-1" ref={typeDropdownRef}>
                <label className="text-[11px] text-white/50">
                  Tipo de gasto
                </label>
                <button
                  type="button"
                  onClick={() => setTypeDropdownOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#151515] bg-[#070707] px-3 py-2 text-xs text-white/80 hover:border-white/30 transition-colors"
                >
                  <span>
                    {expenseType === 'ad'
                      ? 'Anúncio (tráfego / mídia paga)'
                      : 'MED (reembolso / ajuste / chargeback)'}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-white/60 transition-transform ${
                      typeDropdownOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {typeDropdownOpen && (
                  <div className="mt-1 w-full overflow-hidden rounded-xl border border-[#151515] bg-[#050505] text-xs shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseType('ad')
                        setTypeDropdownOpen(false)
                        setFormError(null)
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-white/5 ${
                        expenseType === 'ad' ? 'bg-white/5' : ''
                      }`}
                    >
                      <span className="text-white/90">Anúncio</span>
                      <span className="text-[10px] text-white/40">
                        Tráfego pago, campanhas, mídia, impulsionamento etc.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseType('med')
                        setTypeDropdownOpen(false)
                        setFormError(null)
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-white/5 ${
                        expenseType === 'med' ? 'bg-white/5' : ''
                      }`}
                    >
                      <span className="text-white/90">MED (reembolso)</span>
                      <span className="text-[10px] text-white/40">
                        Reembolsos, chargebacks, ajustes de comissão,
                        estornos e MED em geral.
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* site - DROPDOWN custom */}
              <div className="space-y-1" ref={siteDropdownRef}>
                <label className="text-[11px] text-white/50">
                  Site / projeto
                </label>
                <button
                  type="button"
                  disabled={sitesLoading}
                  onClick={() =>
                    !sitesLoading && setSiteDropdownOpen((open) => !open)
                  }
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    sitesLoading
                      ? 'border-[#151515] bg-[#050505] text-white/40 cursor-not-allowed'
                      : 'border-[#151515] bg-[#070707] text-white/80 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    {selectedSite ? (
                      <>
                        <span className="text-xs text-white/90">
                          {selectedSite.siteName}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {selectedSite.partnerName
                            ? `${selectedSite.partnerName} · ${
                                selectedSite.domain || selectedSite.siteSlug
                              }`
                            : selectedSite.domain || selectedSite.siteSlug}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-white/40">
                        {sitesLoading
                          ? 'Carregando sites...'
                          : 'Selecione um site'}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-white/60 transition-transform ${
                      siteDropdownOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {siteDropdownOpen && !sitesLoading && (
                  <div className="absolute z-50 mt-1 w-full max-w-md overflow-hidden rounded-xl border border-[#151515] bg-[#050505] text-xs shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSiteSlugInput('')
                        setSiteDropdownOpen(false)
                      }}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-white/55 hover:bg-white/5"
                    >
                      <span>Limpar seleção</span>
                    </button>

                    <div className="border-t border-white/5 my-1" />

                    {sites.length === 0 && (
                      <div className="px-3 py-3 text-[11px] text-white/40">
                        Nenhum site configurado.
                      </div>
                    )}

                    {sites.map((s) => {
                      const isActive = s.siteSlug === siteSlugInput
                      return (
                        <button
                          key={s.siteSlug}
                          type="button"
                          onClick={() => {
                            setSiteSlugInput(s.siteSlug)
                            setSiteDropdownOpen(false)
                            setFormError(null)
                          }}
                          className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-white/5 ${
                            isActive ? 'bg-white/5' : ''
                          }`}
                        >
                          <span className="text-white/90">
                            {s.siteName}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {s.partnerName
                              ? `${s.partnerName} · ${
                                  s.domain || s.siteSlug
                                }`
                              : s.domain || s.siteSlug}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* valor */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/50">
                  Valor do gasto (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 150,00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#151515] bg-[#070707] px-3 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/30"
                />
              </div>

              {/* observação */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/50">
                  Observações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: Reembolso de pedido X, taxa MED do gateway..."
                  className="w-full rounded-lg border border-[#151515] bg-[#070707] px-3 py-2 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/30 resize-none"
                />
              </div>

              {formError && (
                <p className="text-[11px] text-red-400/80">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-[11px] text-emerald-400/80">
                  {formSuccess}
                </p>
              )}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs text-white/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-xs font-medium hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Registrar gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* animações do calendário / modal */}
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
