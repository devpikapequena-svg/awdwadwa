// app/resumo-financeiro/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import {
  Wallet2,
  ShoppingBag,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

type SalesSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
}

type Sale = {
  id: string
  amount: number
  createdAt: string
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

type FinanceiroResponse = {
  summary: SalesSummary
  orders: Sale[]
  partners: PartnerRow[]
  totals?: {
    totalCommission: number
    totalPaid: number
    totalBalance: number
  }
}

export default function ResumoFinanceiroPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [lastOrders, setLastOrders] = useState<Sale[]>([])
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loadingFinance, setLoadingFinance] = useState(true)

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
      } catch (err) {
        console.error('Erro ao buscar usuário', err)
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchFinance = async () => {
      setLoadingFinance(true)
      try {
        const res = await fetch('/api/financeiro?period=last30', {
          method: 'GET',
          credentials: 'include',
        })

        if (res.ok) {
          const data: FinanceiroResponse = await res.json()

          setSummary(data.summary || null)
          setLastOrders(
            Array.isArray(data.orders) ? data.orders.slice(0, 5) : [],
          )
          setPartners(
            Array.isArray(data.partners) ? data.partners : [],
          )
        } else {
          setSummary(null)
          setLastOrders([])
          setPartners([])
        }
      } catch (err) {
        console.error('Erro ao buscar resumo financeiro', err)
        setSummary(null)
        setLastOrders([])
        setPartners([])
      } finally {
        setLoadingFinance(false)
      }
    }

    fetchFinance()
  }, [user])

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

  // totais de comissões & repasses (caso a API não mande totals prontos)
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
            Faça login novamente para acessar o resumo financeiro.
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

  const periodLabel =
    summary?.periodLabel || 'Últimos 30 dias (vendas BuckPay)'

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col gap-8">
<header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
  {/* Glow topo */}
  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

  {/* Glow canto */}
  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Resumo financeiro
      </h1>
      <p className="mt-1 max-w-md text-[12px] text-white/60">
        Visão geral do faturamento, liquidez e comissões geradas no período.
      </p>
    </div>

    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
        <BarChart3 className="h-3.5 w-3.5 text-white/70" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-white/50">
          Base de dados
        </span>
        <span className="text-[11px] text-white/80">
          BuckPay + parceiros cadastrados
        </span>
      </div>
    </div>
  </div>
</header>


          {/* RESUMO GERAL */}
<section className="grid grid-cols-1 gap-4 md:grid-cols-5 mt-2">
            <ResumoCard
              icon={ShoppingBag}
              label="Faturamento bruto (30 dias)"
              value={
                summary ? formatCurrency(summary.totalGross) : 'R$ 0,00'
              }
            />
            <ResumoCard
              icon={Wallet2}
              label="Lucro líquido dos sites"
              value={
                summary ? formatCurrency(summary.totalNet) : 'R$ 0,00'
              }
            />
            <ResumoCard
              icon={Wallet2}
              label="Sua comissão (gerada)"
              value={formatCurrency(
                summary?.myCommissionTotal ?? totalCommission,
              )}
              accent
            />
            <ResumoCard
              icon={ArrowDownCircle}
              label="Repasses já recebidos"
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
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.05fr)]">
            {/* RESUMO VENDAS – DESIGN MELHORADO */}
            <div className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 overflow-hidden">
              {/* linha glow no topo */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
              {/* glow de fundo */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/60 border border-white/5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                      <ShoppingBag className="h-3 w-3 text-emerald-300" />
                    </span>
                    <span className="uppercase tracking-[0.12em] text-[9px] text-white/55">
                      Vendas BuckPay
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white/60">
                      {periodLabel}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold mt-2">
                    Resumo de vendas
                  </h2>
                  <p className="text-[11px] text-white/55">
                    Faturamento e volume de pedidos com base nos pagamentos
                    processados pela BuckPay.
                  </p>
                </div>
              </div>

              {loadingFinance ? (
                <div className="h-32 rounded-2xl border border-[#202020] bg-[#080808]" />
              ) : !summary ? (
                <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                  Ainda não encontramos vendas recentes na BuckPay.
                </div>
              ) : (
                <>
                  {/* mini stats em cards mais premium */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-[11px]">
                    <MiniStat
                      label="Pedidos no período"
                      value={`${summary.totalOrders} pedidos`}
                    />
                    <MiniStat
                      label="Ticket médio"
                      value={formatCurrency(summary.averageTicket || 0)}
                    />
                    <MiniStat
                      label="Comissão média por pedido"
                      value={
                        summary.totalOrders > 0
                          ? formatCurrency(
                              (summary.myCommissionTotal || 0) /
                                summary.totalOrders,
                            )
                          : 'R$ 0,00'
                      }
                    />
                  </div>

                  {/* últimas vendas com layout melhorzinho */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[11px] text-white/55">
                        Últimas vendas registradas
                      </p>
                      {summary.totalOrders > 0 && (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/50 border border-white/5">
                          {summary.totalOrders} pedidos no período
                        </span>
                      )}
                    </div>

                    {lastOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-4 text-[11px] text-white/60">
                        Nenhuma venda recente nesse período.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#202020] bg-[#080808] px-3.5 py-3 text-[11px]">
                        <ul className="space-y-2.5">
                          {lastOrders.map((o) => (
                            <li
                              key={o.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-200">
                                  R$
                                </span>
                                <span className="text-white/85">
                                  {formatCurrency(o.amount)}
                                </span>
                              </div>
                              <span className="text-[10px] text-white/45 whitespace-nowrap">
                                {formatDateTime(o.createdAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* RESUMO COMISSÕES – DESIGN MELHORADO */}
            <div className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 overflow-hidden">
              {/* linha glow topo */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
              {/* glow */}
              <div className="pointer-events-none absolute -left-24 -top-24 h-40 w-40 rounded-full bg-sky-500/12 blur-3xl" />

              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/60 border border-white/5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/15">
                      <Wallet2 className="h-3 w-3 text-sky-300" />
                    </span>
                    <span className="uppercase tracking-[0.12em] text-[9px] text-white/55">
                      Comissões & repasses
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white/60">
                      Por parceiro
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold mt-2">
                    Comissões & repasses por parceiro
                  </h2>
                  <p className="text-[11px] text-white/55">
                    Acompanhe o que cada site já gerou pra você, quanto já foi
                    repassado e o saldo que ainda falta acertar.
                  </p>
                </div>
              </div>

              {loadingFinance ? (
                <div className="h-32 rounded-2xl border border-[#202020] bg-[#080808]" />
              ) : partners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                  Nenhum parceiro configurado ainda. Use a tela{' '}
                  <span className="font-semibold">Parceiros &amp; sites</span>{' '}
                  para cadastrar.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#202020] bg-[#080808] px-3.5 py-3 text-[11px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white/55">
                      Top parceiros (por comissão gerada)
                    </span>
                    {partners.length > 5 && (
                      <Link
                        href="/comissoes"
                        className="text-[10px] text-emerald-300 hover:underline underline-offset-2"
                      >
                        Ver detalhado
                      </Link>
                    )}
                  </div>

                  <div className="space-y-3">
                    {partners
                      .slice(0, 5)
                      .sort(
                        (a, b) =>
                          (b.myCommission || 0) - (a.myCommission || 0),
                      )
                      .map((p) => {
                        const balanceClass =
                          p.balance > 0
                            ? 'text-amber-300'
                            : p.balance < 0
                            ? 'text-sky-300'
                            : 'text-emerald-300'

                        const balanceLabel =
                          p.balance > 0
                            ? 'Em aberto'
                            : p.balance < 0
                            ? 'Adiantado'
                            : 'Acertado'

                        const percent =
                          p.myCommission > 0
                            ? Math.min(
                                100,
                                Math.max(
                                  0,
                                  (p.totalPaid / p.myCommission) * 100,
                                ),
                              )
                            : 0

                        return (
                          <div
                            key={p.partnerId}
                            className="rounded-2xl border border-[#262626] bg-black/20 px-3.5 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] uppercase text-white/80">
                                  {p.partnerName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold text-white/85">
                                    {p.partnerName}
                                  </span>
                                  <span className="text-[10px] text-white/45">
                                    {p.siteName} ({p.siteSlug})
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] ${balanceClass} border-white/10 bg-white/5`}
                              >
                                {balanceLabel}
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                              <div className="flex flex-col">
                                <span className="text-white/45">
                                  Comissão
                                </span>
                                <span className="text-white/85">
                                  {formatCurrency(p.myCommission)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white/45">
                                  Já pago
                                </span>
                                <span className="text-white/75">
                                  {formatCurrency(p.totalPaid)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white/45">
                                  Saldo
                                </span>
                                <span
                                  className={`font-semibold ${balanceClass}`}
                                >
                                  {formatCurrency(p.balance)}
                                </span>
                              </div>
                            </div>

                            {/* barrinha de progresso do acerto */}
                            <div className="mt-2">
                              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[9px] text-white/40">
                                {percent.toFixed(0)}% da comissão já repassada.
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

/* COMPONENTES AUXILIARES */

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
    <div className="
      relative rounded-2xl border border-[#1f1f1f]
      bg-gradient-to-br from-[#0b0b0b] via-[#090909] to-[#050505]
      px-5 py-4 shadow-[0_0_20px_rgba(0,0,0,0.35)]
      hover:shadow-[0_0_35px_rgba(0,0,0,0.55)]
      transition-all duration-300 overflow-hidden
    ">
      {/* Linha neon topo */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Glow canto */}
      <div className={`pointer-events-none absolute -right-14 -top-14 h-24 w-24 rounded-full ${
        accent ? 'bg-emerald-500/10' : 'bg-white/5'
      } blur-2xl`} />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-white/55">{label}</p>
          <p className={`text-lg font-semibold tracking-tight ${
            accent ? 'text-emerald-300' : 'text-white'
          }`}>
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


function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#080808] px-4 py-3">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-white">{value}</p>
    </div>
  )
}
