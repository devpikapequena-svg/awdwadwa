// app/comissoes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import {
  BarChart3,
  Wallet2,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
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
  siteSlug: string
  siteName: string
  totalGross: number
  totalNet: number
  myCommission: number
  totalPaid: number
  balance: number
  payments: PartnerPaymentRow[]
}

export default function ComissoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loadingPartners, setLoadingPartners] = useState(true)

  // Form de pagamento recebido
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal de histórico
  const [historyPartner, setHistoryPartner] = useState<PartnerRow | null>(null)

  // ===== Helpers =====

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

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

  const fetchPartners = async () => {
    setLoadingPartners(true)
    try {
      const res = await fetch('/api/notas', {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        setPartners([])
        return
      }

      const data = await res.json()
      const rows: PartnerRow[] = Array.isArray(data.partners)
        ? data.partners
        : []

      setPartners(rows)

      // se ainda não tiver partner selecionado, pega o primeiro
      if (rows.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(rows[0].partnerId)
      }
    } catch (err) {
      console.error('Erro ao buscar comissoes e repasses de parceiros', err)
      setPartners([])
    } finally {
      setLoadingPartners(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchPartners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const selectedPartner = partners.find(
    (p) => p.partnerId === selectedPartnerId,
  )

  // Totais gerais
  const totalCommission = partners.reduce(
    (acc, p) => acc + (p.myCommission || 0),
    0,
  )
  const totalPaid = partners.reduce(
    (acc, p) => acc + (p.totalPaid || 0),
    0,
  )
  const totalBalance = partners.reduce(
    (acc, p) => acc + Math.max(p.balance || 0, 0),
    0,
  )

  // ===== Submit pagamento recebido =====
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedPartnerId) {
      setFormError('Selecione um parceiro')
      return
    }

    const numeric = Number(
      String(amount).replace('.', '').replace(',', '.'),
    )
    if (!numeric || numeric <= 0) {
      setFormError('Informe um valor válido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/notas', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: selectedPartnerId,
          amount: numeric,
          note,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(
          data?.error || 'Não foi possível registrar o pagamento.',
        )
        return
      }

      // recarrega dados
      setAmount('')
      setNote('')
      await fetchPartners()
    } catch (err) {
      console.error('Erro ao registrar pagamento', err)
      setFormError('Erro interno ao registrar pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

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

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {/* HEADER IGUAL AS OUTRAS PÁGINAS (CARD PREMIUM) */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            {/* linha glow topo */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            {/* glow canto */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Comissões & repasses
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Controle tudo que os sites já geraram de comissão pra você, o que
                  já foi repassado e o saldo que ainda falta acertar com cada parceiro.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
                  <BarChart3 className="h-3.5 w-3.5 text-white/70" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">
                    Visão
                  </span>
                  <span className="text-[11px] text-white/80">
                    Comissões geradas x repasses recebidos
                  </span>
                </div>
              </div>
            </div>
          </header>


          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResumoCard
              icon={Wallet2}
              label="Comissão total gerada"
              value={formatCurrency(totalCommission)}
            />
            <ResumoCard
              icon={ArrowDownCircle}
              label="Pagamentos já recebidos"
              value={formatCurrency(totalPaid)}
            />
            <ResumoCard
              icon={ArrowUpCircle}
              label="Saldo ainda a receber"
              value={formatCurrency(totalBalance)}
              accent
            />
          </section>

          {/* GRID PRINCIPAL */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
            {/* TABELA PRINCIPAL – ESTILO NOVO */}
            <div className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 overflow-hidden">
              {/* linha glow topo */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
              {/* glow de fundo */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Saldo por parceiro
                  </h2>
                  <p className="mt-1 text-[11px] text-white/55">
                    Sua comissão calculada sobre as vendas de cada site, o que
                    já entrou na sua mão e o que ainda falta cada parceiro te pagar.
                  </p>
                </div>
              </div>

              {loadingPartners ? (
                <div className="h-32 rounded-2xl border border-[#202020] bg-[#080808]" />
              ) : partners.length === 0 ? (
                <div className="relative rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                  Nenhum parceiro configurado ainda.
                  <br />
                  <span className="text-white/45">
                    Cadastre os sites em{' '}
                    <span className="font-semibold">
                      Parceiros &amp; sites
                    </span>{' '}
                    para começar a acompanhar seus acertos.
                  </span>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-[#202020] bg-[#080808]">
                  <table className="min-w-full border-collapse text-[11px]">
                    <thead className="bg-black/40 text-white/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-normal">
                          Parceiro / site
                        </th>
                        <th className="px-4 py-2 text-right font-normal">
                          Comissão gerada
                        </th>
                        <th className="px-4 py-2 text-right font-normal">
                          Já pago
                        </th>
                        <th className="px-4 py-2 text-right font-normal">
                          Saldo
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((p) => {
                        const balanceClass =
                          p.balance > 0
                            ? 'text-amber-300'
                            : p.balance < 0
                            ? 'text-sky-300'
                            : 'text-emerald-300'

                        return (
                          <tr
                            key={p.partnerId}
                            className="border-t border-[#262626] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] uppercase">
                                  {p.partnerName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold text-white/85">
                                    {p.partnerName}
                                  </span>
                                  <span className="text-[10px] text-white/45">
                                    {p.siteName}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 align-middle text-[10px] text-white/80">
                              <div className="pl-6">
                                {formatCurrency(p.myCommission)}
                              </div>
                            </td>

                            <td className="px-4 py-3 align-middle text-right text-[10px] text-white/70">
                              {formatCurrency(p.totalPaid)}
                            </td>

                            <td
                              className={`px-4 py-3 align-middle text-right text-[10px] font-semibold ${balanceClass}`}
                            >
                              {formatCurrency(p.balance)}
                            </td>

                            <td className="px-4 py-3 align-top text-center text-[10px]">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPartnerId(p.partnerId)
                                  }}
                                  className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200 hover:bg-emerald-500/20 transition"
                                >
                                  Registrar recebimento
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHistoryPartner(p)}
                                  className="rounded-full border border-[#303030] bg-[#111111] px-3 py-1 text-[10px] text-white/70 hover:bg-white/5 transition"
                                >
                                  Ver histórico
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CARD DE REGISTRO DE PAGAMENTO – ESTILO NOVO */}
            <div className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 overflow-hidden">
              {/* linha glow topo */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              {/* glow */}
              <div className="pointer-events-none absolute -right-24 -bottom-24 h-40 w-40 rounded-full bg-emerald-500/12 blur-3xl" />

              <div className="relative">
                <h2 className="text-sm font-semibold">
                  Registrar repasse recebido
                </h2>

                <form
                  onSubmit={handleSubmitPayment}
                  className="mt-4 space-y-4 text-[11px]"
                >
                  <div className="space-y-1.5">
                    <label className="block text-white/70">
                      Parceiro{' '}
                      <span className="text-white/35">(obrigatório)</span>
                    </label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) =>
                        setSelectedPartnerId(e.target.value || '')
                      }
                      className="w-full rounded-xl border border-[#262626] bg-[#080808] px-3 py-2 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Selecione um parceiro</option>
                      {partners.map((p) => (
                        <option key={p.partnerId} value={p.partnerId}>
                          {p.partnerName} — {p.siteName}
                        </option>
                      ))}
                    </select>

                    {selectedPartner && (
                      <p className="text-[10px] text-white/45">
                        Comissão gerada:{' '}
                        <span className="text-white/75">
                          {formatCurrency(selectedPartner.myCommission)}
                        </span>{' '}
                        · Já pago:{' '}
                        <span className="text-white/75">
                          {formatCurrency(selectedPartner.totalPaid)}
                        </span>{' '}
                        · Saldo atual:{' '}
                        <span
                          className={
                            selectedPartner.balance > 0
                              ? 'text-amber-300'
                              : selectedPartner.balance < 0
                              ? 'text-sky-300'
                              : 'text-emerald-300'
                          }
                        >
                          {formatCurrency(selectedPartner.balance)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-white/70">
                      Valor recebido{' '}
                      <span className="text-white/35">(em R$)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Ex: 150,00"
                      className="w-full rounded-xl border border-[#262626] bg-[#080808] px-3 py-2 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-white/70">
                      Anotação (opcional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Ex: Pix dia 02/12, acertando as vendas da Black Friday."
                      className="w-full rounded-xl border border-[#262626] bg-[#080808] px-3 py-2 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {formError && (
                    <p className="text-[10px] text-red-400">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedPartnerId}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-[11px] font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowDownCircle className="h-3 w-3" />
                    {submitting
                      ? 'Registrando pagamento...'
                      : 'Confirmar pagamento recebido'}
                  </button>

                  <p className="mt-2 text-[10px] text-white/40">
                    Dica: sempre que um parceiro te mandar Pix/depósito, lança
                    aqui. Assim você sabe exatamente quem tá devendo e quem tá
                    com os acertos em dia.
                  </p>
                </form>
              </div>
            </div>
          </section>
        </div>

        {/* MODAL HISTÓRICO DE PAGAMENTOS – ESTILO NOVO */}
        {historyPartner && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2a2a2a] bg-gradient-to-br from-[#070707] via-[#050505] to-[#020202] px-5 py-5 md:px-6 md:py-6 shadow-[0_24px_120px_rgba(0,0,0,0.9)]">
              {/* linha glow topo */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
              {/* glow canto */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] text-white/45">
                    Histórico de pagamentos
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-white">
                    {historyPartner.partnerName}
                  </h2>
                  <p className="text-[10px] text-white/45">
                    {historyPartner.siteName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryPartner(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                  <p className="text-white/45">Comissão gerada</p>
                  <p className="mt-1 text-[11px] font-semibold text-white">
                    {formatCurrency(historyPartner.myCommission)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                  <p className="text-white/45">Já pago</p>
                  <p className="mt-1 text-[11px] font-semibold text-white">
                    {formatCurrency(historyPartner.totalPaid)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#262626] bg-[#080808] px-3 py-2">
                  <p className="text-white/45">Saldo atual</p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-300">
                    {formatCurrency(historyPartner.balance)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] text-white/55">
                  Pagamentos registrados
                </p>

                {historyPartner.payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-4 py-4 text-[11px] text-white/60">
                    Nenhum pagamento lançado ainda para esse parceiro.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-[#262626] bg-[#080808]">
                    <ul className="divide-y divide-[#262626]/80">
                      {historyPartner.payments.map((pg) => (
                        <li
                          key={pg.id}
                          className="flex items-start justify_between gap-3 px-4 py-2.5"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium text-white">
                              {formatCurrency(pg.amount)}
                            </span>
                            {pg.note && (
                              <span className="text-[10px] text_white/55">
                                {pg.note}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 whitespace-nowrap">
                            {formatDateTime(pg.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setHistoryPartner(null)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#262626] bg-[#101010] px-4 py-2.5 text-[11px] text-white/80 hover:bg-white/5 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

/* COMPONENTE RESUMO – MESMO ESTILO DOS CARDS DO RESUMO FINANCEIRO */

function ResumoCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: boolean
}) {
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
      {/* Linha neon topo */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Glow canto */}
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-24 w-24 rounded-full ${
          accent ? 'bg-emerald-500/10' : 'bg-white/5'
        } blur-2xl`}
      />

      <div className="relative flex items-center justify-between gap-2">
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
    </div>
  )
}
