// src/app/ads/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import {
  Wallet2,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  Globe2,
} from 'lucide-react'

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000

function getTodayRefDate(): string {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)

  const y = nowBrtFake.getFullYear()
  const m = (nowBrtFake.getMonth() + 1).toString().padStart(2, '0')
  const d = nowBrtFake.getDate().toString().padStart(2, '0')

  return `${y}-${m}-${d}`
}

function getYesterdayRefDate(): string {
  const nowUtc = new Date()
  const nowBrtFake = new Date(nowUtc.getTime() - BRAZIL_OFFSET_MS)
  const yesterdayBrtFake = new Date(nowBrtFake.getTime() - 24 * 60 * 60 * 1000)

  const y = yesterdayBrtFake.getFullYear()
  const m = (yesterdayBrtFake.getMonth() + 1).toString().padStart(2, '0')
  const d = yesterdayBrtFake.getDate().toString().padStart(2, '0')

  return `${y}-${m}-${d}`
}

type User = {
  id: string
  name: string
  email: string
}

type AdSpendItem = {
  _id: string
  siteSlug: string
  siteName: string
  refDate: string
  amount: number
  notes?: string | null
  createdAt?: string
}

type AdsSummary = {
  refDate: string
  totalSpent: number
  items: AdSpendItem[]
}

type SiteOption = {
  siteSlug: string
  siteName: string
  partnerName: string
  domain: string
}

type DayMode = 'today' | 'yesterday' | 'custom'

export default function AdsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [sites, setSites] = useState<SiteOption[]>([])
  const [loadingSites, setLoadingSites] = useState(true)

  const [dayMode, setDayMode] = useState<DayMode>('today')
  const [refDate, setRefDate] = useState<string>(() => getTodayRefDate())

  const [selectedSiteSlug, setSelectedSiteSlug] = useState<string>('')
  const [amount, setAmount] = useState<string>('') // input string
  const [notes, setNotes] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [loadingAds, setLoadingAds] = useState(true)
  const [adsSummary, setAdsSummary] = useState<AdsSummary | null>(null)

  // Carrega usuário
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

  // Carrega sites (PartnerProjects)
  useEffect(() => {
    if (!user) return

    const fetchSites = async () => {
      try {
        setLoadingSites(true)
        const res = await fetch('/api/ads/sites', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setSites([])
          return
        }

        const data = await res.json()
        setSites(data.items || [])
      } catch {
        setSites([])
      } finally {
        setLoadingSites(false)
      }
    }

    fetchSites()
  }, [user])

  // Carrega gastos de ADS para o dia selecionado
  useEffect(() => {
    if (!user) return

    const fetchAds = async () => {
      try {
        setLoadingAds(true)
        const res = await fetch(`/api/ads?date=${refDate}`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setAdsSummary({
            refDate,
            totalSpent: 0,
            items: [],
          })
          return
        }

        const data = await res.json()
        setAdsSummary(data)
      } catch {
        setAdsSummary({
          refDate,
          totalSpent: 0,
          items: [],
        })
      } finally {
        setLoadingAds(false)
      }
    }

    fetchAds()
  }, [user, refDate])

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const refDateLabel = refDate.split('-').reverse().join('/')

  const handleChangeDayMode = (mode: DayMode) => {
    setDayMode(mode)
    if (mode === 'today') {
      const d = getTodayRefDate()
      setRefDate(d)
    } else if (mode === 'yesterday') {
      const d = getYesterdayRefDate()
      setRefDate(d)
    }
    // custom -> não mexe no refDate, só deixa o date input livre
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSiteSlug || !refDate || !amount) return

    const parsedAmount = Number(
      String(amount).replace('.', '').replace(',', '.'),
    )

    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    try {
      setSaving(true)
      const res = await fetch('/api/ads', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refDate,
          siteSlug: selectedSiteSlug,
          amount: parsedAmount,
          notes: notes || null,
        }),
      })

      if (!res.ok) {
        // aqui depois dá pra colocar toast/erro bonitinho
        return
      }

      // limpa valor e notas, mantém site e dia
      setAmount('')
      setNotes('')

      // recarrega lista
      const updated = await fetch(`/api/ads?date=${refDate}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (updated.ok) {
        const data = await updated.json()
        setAdsSummary(data)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen bg-[#050505] text-white">
        <aside className="w-64 border-r border-[#161616] bg-[#080808]" />
        <section className="flex-1 px-10 py-10">
          <div className="h-6 w-40 rounded-full bg-[#141414]" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
            Faça login novamente para acessar o controle de ADS.
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

  const totalSpent = adsSummary?.totalSpent ?? 0
  const items = adsSummary?.items ?? []

  const selectedSiteObj = sites.find((s) => s.siteSlug === selectedSiteSlug)

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-7xl flex flex-col gap-8">
          {/* HEADER PREMIUM */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Controle de ADS
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Registre quanto foi gasto em tráfego pago para cada site e
                  bata isso com o faturamento do dashboard.
                </p>

                <p className="mt-2 text-[11px] text-white/45">
                  Exemplo: hoje é 05/12, mas você quer registrar o gasto de{' '}
                  <span className="font-semibold text-white/80">
                    ontem (04/12)
                  </span>
                  . É só escolher &quot;Ontem&quot; ali em cima ou ajustar a
                  data manualmente.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 text-xs md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
                    <Wallet2 className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">
                      Total gasto no dia selecionado
                    </span>
                    <span className="text-[11px] text-emerald-300">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                </div>

                {/* PILLS: HOJE / ONTEM / OUTRO DIA + DATE INPUT */}
                <div className="flex flex-col gap-2">
                  <div className="inline-flex overflow-hidden rounded-full border border-[#262626] bg-[#080808] text-[11px]">
                    {(['today', 'yesterday', 'custom'] as DayMode[]).map(
                      (mode) => {
                        const label =
                          mode === 'today'
                            ? 'Hoje'
                            : mode === 'yesterday'
                            ? 'Ontem'
                            : 'Outro dia'
                        const active = dayMode === mode
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => handleChangeDayMode(mode)}
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

                  <label className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#080808] px-3 py-1.5 text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-white/60" />
                    <span className="text-white/60 text-[10px]">
                      Dia de referência
                    </span>
                    <input
                      type="date"
                      value={refDate}
                      onChange={(e) => {
                        setRefDate(e.target.value)
                        setDayMode('custom')
                      }}
                      className="bg-transparent text-white text-[11px] outline-none border-0 focus:ring-0 px-1"
                    />
                  </label>
                </div>
              </div>
            </div>
          </header>

          {/* GRID: FORM + RESUMO */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* FORM */}
            <div className="relative rounded-3xl border border-[#1f1f1f] bg-gradient-to-br from-[#0b0b0b] via-[#090909] to-[#050505] px-5 py-5 shadow-[0_0_20px_rgba(0,0,0,0.35)]">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <div className="relative flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Registrar gasto de anúncios
                  </h2>
                  <p className="mt-1 text-[11px] text-white/50">
                    Selecione o site, o dia e informe o valor gasto em ADS
                    (Meta, Google, TikTok, etc.).
                  </p>
                </div>

                <div className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 border border-white/5">
                  <PlusCircle className="h-4 w-4 text-white/70" />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {/* SITE SELECT */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-white/50" />
                    Site / projeto
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSiteSlug}
                      onChange={(e) => setSelectedSiteSlug(e.target.value)}
                      disabled={loadingSites || sites.length === 0}
                      className="w-full rounded-xl border border-[#262626] bg-[#050505] px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-500/40 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingSites
                          ? 'Carregando sites...'
                          : sites.length === 0
                          ? 'Nenhum site configurado ainda'
                          : 'Selecione o site'}
                      </option>
                      {sites.map((s) => (
                        <option key={s.siteSlug} value={s.siteSlug}>
                          {s.siteName} ({s.siteSlug}) — {s.partnerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSiteObj && (
                    <p className="text-[10px] text-white/40 mt-1">
                      Parceiro: {selectedSiteObj.partnerName}{' '}
                      {selectedSiteObj.domain && (
                        <>• Domínio: {selectedSiteObj.domain}</>
                      )}
                    </p>
                  )}
                </div>

                {/* VALOR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-white/60">
                    Valor gasto em ADS
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex.: 120,00"
                    className="w-full rounded-xl border border-[#262626] bg-[#050505] px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-500/40 placeholder:text-white/30"
                  />
                  <p className="text-[10px] text-white/35">
                    Valor total do dia para esse site (somando todas as
                    campanhas).
                  </p>
                </div>

                {/* OBS */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] text-white/60">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex.: Meta Ads - campanhas de conversão, criativo novo, CBO 100/dia..."
                    className="w-full rounded-xl border border-[#262626] bg-[#050505] px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-500/40 placeholder:text-white/30 resize-none"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                  <p className="text-[10px] text-white/40 max-w-xs">
                    Você pode registrar múltiplos sites no mesmo dia. Depois é
                    só cruzar isso com o lucro líquido que já aparece no
                    dashboard.
                  </p>

                  <button
                    type="submit"
                    disabled={saving || !selectedSiteSlug || !amount}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-[12px] font-semibold text-black shadow-[0_0_20px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40 disabled:shadow-none"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar gasto de ADS'}
                  </button>
                </div>
              </form>
            </div>

            {/* CARD RESUMO / INFO */}
            <div className="flex flex-col gap-4">
              <div className="relative rounded-3xl border border-[#1f1f1f] bg-gradient-to-br from-[#050505] via-[#050607] to-[#020202] px-5 py-5 shadow-[0_0_20px_rgba(0,0,0,0.35)]">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                <div className="pointer-events-none absolute -right-16 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-white/60">
                      Total gasto em {refDateLabel}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-300">
                      {formatCurrency(totalSpent)}
                    </p>
                    <p className="mt-2 text-[11px] text-white/45">
                      Some esse valor com o{' '}
                      <span className="font-semibold text-white/80">
                        lucro líquido do dashboard
                      </span>{' '}
                      pra ver quanto realmente sobrou em cada site e calcular
                      seu ROAS.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 border border-white/10">
                    <ArrowUpRight className="h-4 w-4 text-white/70" />
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 text-[10px] text-white/40">
                  <li>• Registre sempre no final do dia.</li>
                  <li>• Um registro por site por dia já resolve bem.</li>
                  <li>• Depois dá pra somar por período (7/30 dias) se quiser.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* HISTÓRICO */}
          <section className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

            <div className="relative flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Gastos de ADS do dia
                </h2>
                <p className="mt-1 text-[11px] text-white/50">
                  Todos os registros de tráfego pago para {refDateLabel}.
                </p>
              </div>
              <span className="text-[10px] text-white/40">
                {items.length} {items.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {loadingAds ? (
              <div className="h-32 rounded-2xl border border-[#252525] bg-black/30" />
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#262626] bg-black/30 px-4 py-5 text-[11px] text-white/60">
                Nenhum gasto de ADS cadastrado para esse dia ainda. Preencha o
                formulário acima para registrar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] text-white/45">
                      <th className="px-3 py-2 font-medium">Site</th>
                      <th className="px-3 py-2 font-medium">Slug</th>
                      <th className="px-3 py-2 font-medium">Valor gasto</th>
                      <th className="px-3 py-2 font-medium">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ad) => (
                      <tr
                        key={ad._id}
                        className="border-b border-[#151515] last:border-0 hover:bg-white/5/10"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white/85 font-medium">
                              {ad.siteName}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {refDateLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-white/60">
                          {ad.siteSlug}
                        </td>
                        <td className="px-3 py-2 align-top text-emerald-300 font-semibold">
                          {formatCurrency(ad.amount)}
                        </td>
                        <td className="px-3 py-2 align-top text-white/50 max-w-xs">
                          {ad.notes ? (
                            <span className="line-clamp-2">{ad.notes}</span>
                          ) : (
                            <span className="text-white/25">Sem observações</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
