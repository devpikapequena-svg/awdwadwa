'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  ShoppingBag,
  Wallet2,
  LineChart,
  Receipt,
  Filter,
  ArrowDownUp,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  QrCode,
  ChevronDown,
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

type OrderStatus = 'paid' | 'pending' | 'med'

type Sale = {
  id: string
  siteName: string
  partnerName: string
  buckpayOrderId?: string | null
  amount: number
  netAmount: number
  myCommission: number
  status: OrderStatus
  paymentMethod: 'pix' | 'card' | 'boleto' | string
  source?: string | null
  campaign?: string | null
  createdAt: string
  customerName?: string | null
  gateway?: 'buckpay' | 'blackcat' | string   // 👈 AQUI
}



type SalesSummary = {
  periodLabel: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  averageTicket: number | null
}

type SalesResponse = {
  summary: SalesSummary
  orders: Sale[]
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'med'
type PeriodFilter = 'today' | 'yesterday' | 'last7' | 'last30'

export default function VendasPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [orders, setOrders] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(true)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today')
  const [sortDesc, setSortDesc] = useState(true)
  const [partnerFilter, setPartnerFilter] = useState<'all' | string>('all')

  const [partnerOpen, setPartnerOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

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

    const fetchSales = async () => {
      try {
        const res = await fetch(`/api/vendas?period=${periodFilter}`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setSummary(null)
          setOrders([])
          return
        }

        const data: SalesResponse = await res.json()
        setSummary(data?.summary ?? null)
        setOrders(Array.isArray(data?.orders) ? data.orders : [])
      } catch (err) {
        console.error('Erro ao buscar vendas', err)
        setSummary(null)
        setOrders([])
      } finally {
        setLoadingSales(false)
      }
    }

    setLoadingSales(true)
    fetchSales()
  }, [user, periodFilter])

  // sempre que mexer em filtro ou trocar as vendas, volta pra página 1
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, partnerFilter, periodFilter, orders.length])

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const periodLabel = summary?.periodLabel || 'Hoje'

  const partnerOptions = Array.from(
    new Set(orders.map((o) => o.partnerName).filter(Boolean)),
  ).sort()

  const kpiOrders = orders.filter(
    (o) =>
      o.status === 'paid' &&
      (partnerFilter === 'all' || o.partnerName === partnerFilter),
  )

  const paidSummary = (() => {
    const totalOrdersPaid = kpiOrders.length
    const totalGrossPaid = kpiOrders.reduce((acc, o) => acc + o.amount, 0)
    const totalNetPaid = kpiOrders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotalPaid = kpiOrders.reduce(
      (acc, o) => acc + o.myCommission,
      0,
    )
    const averageTicketPaid =
      totalOrdersPaid > 0 ? totalGrossPaid / totalOrdersPaid : null

    return {
      totalOrdersPaid,
      totalGrossPaid,
      totalNetPaid,
      myCommissionTotalPaid,
      averageTicketPaid,
    }
  })()

  const filteredOrders: Sale[] = (() => {
    let list = [...orders]

    if (partnerFilter !== 'all') {
      list = list.filter((o) => o.partnerName === partnerFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter)
    }

    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return sortDesc ? tb - ta : ta - tb
    })

    return list
  })()

  // ====== PAGINAÇÃO BASEADA EM filteredOrders ======
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage,
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
            Faça login novamente para ver as vendas dos sites.
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
                  Vendas dos sites
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Acompanhe as vendas confirmadas, lucro líquido e a parte que
                  fica pra você em cada período e por parceiro.
                </p>
              </div>

              <div className="inline-flex flex-col items-start gap-2 text-xs md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
                    <Receipt className="h-3.5 w-3.5 text-white/70" />
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

                <div className="inline-flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                  <span className="rounded-full border border-[#202020] bg-[#101010] px-3 py-1">
                    Pedidos pagos:{' '}
                    <span className="font-semibold text-white/80">
                      {paidSummary.totalOrdersPaid}
                    </span>
                  </span>
                  <span className="rounded-full border border-[#202020] bg-[#101010] px-3 py-1">
                    Receita confirmada:{' '}
                    <span className="font-semibold text-white/80">
                      {formatCurrency(paidSummary.totalGrossPaid)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* KPI CARDS IGUAIS AO RESUMO FINANCEIRO */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4 mt-1">
            <ResumoCard
              icon={ShoppingBag}
              label="Receita bruta (pagas)"
              value={formatCurrency(paidSummary.totalGrossPaid)}
              hint="Total recebido em vendas com pagamento aprovado."
            />
            <ResumoCard
              icon={LineChart}
              label="Lucro líquido (pagas)"
              value={formatCurrency(paidSummary.totalNetPaid)}
              hint="Estimativa de lucro líquido após taxas nas vendas confirmadas."
            />
            <ResumoCard
              icon={Wallet2}
              label="Comissão acumulada"
              value={formatCurrency(paidSummary.myCommissionTotalPaid)}
              hint="Valor reservado para você sobre o lucro dos sites."
              accent
            />
            <ResumoCard
              icon={Receipt}
              label="Ticket médio (pagas)"
              value={
                paidSummary.averageTicketPaid
                  ? formatCurrency(paidSummary.averageTicketPaid)
                  : 'R$ 0,00'
              }
              hint="Valor médio das vendas com pagamento aprovado."
            />
          </section>

          {/* CARD PRINCIPAL VENDAS (FILTROS + TABELA) */}
          <section className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-5 md:px-7 md:py-6 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* linha glow topo */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            {/* glow canto */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5">
              {/* FILTROS */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-white/50">
                    <Filter className="h-3 w-3" />
                    Filtros:
                  </span>

                  {/* STATUS */}
                  <div className="inline-flex overflow-hidden rounded-full border border-[#262626] bg-[#080808]">
                    {(['all', 'paid', 'pending', 'med'] as StatusFilter[]).map(
                      (val) => {
                        const label =
                          val === 'all'
                            ? 'Todos'
                            : val === 'paid'
                            ? 'Pagos'
                            : val === 'pending'
                            ? 'Pendentes'
                            : 'Estornados'
                        const active = statusFilter === val
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setStatusFilter(val)}
                            className={`px-3 py-1.5 text-[11px] transition ${
                              active
                                ? 'bg.white text-black bg-white'
                                : 'text-white/55 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      },
                    )}
                  </div>

                  {/* PARCEIRO – DROPDOWN */}
                  <div className="relative inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#080808] px-3 py-1.5">
                    <span className="text-white/45 text-[11px]">Parceiro</span>

                    <button
                      type="button"
                      onClick={() => {
                        setPartnerOpen((o) => !o)
                        setPeriodOpen(false)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-white/80"
                    >
                      <span>
                        {partnerFilter === 'all'
                          ? 'Todos os parceiros'
                          : partnerFilter}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 text-white/45 transition-transform ${
                          partnerOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {partnerOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-2xl border border-[#262626] bg-[#050505] shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setPartnerFilter('all')
                            setPartnerOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 ${
                            partnerFilter === 'all'
                              ? 'text-emerald-300'
                              : 'text-white/80'
                          }`}
                        >
                          Todos os parceiros
                        </button>
                        {partnerOptions.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPartnerFilter(p)
                              setPartnerOpen(false)
                            }}
                            className={`block w-full px-3 py-2 text-left text-[11px] hover:bg.white/5 hover:bg-white/5 ${
                              partnerFilter === p
                                ? 'text-emerald-300'
                                : 'text-white/80'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PERÍODO – DROPDOWN */}
                  <div className="relative inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#080808] px-3 py-1.5">
                    <Clock className="h-3 w-3 text-white/45" />

                    <button
                      type="button"
                      onClick={() => {
                        setPeriodOpen((o) => !o)
                        setPartnerOpen(false)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-white/80"
                    >
                      <span>
                        {periodFilter === 'today'
                          ? 'Hoje'
                          : periodFilter === 'yesterday'
                          ? 'Ontem'
                          : periodFilter === 'last7'
                          ? 'Últimos 7 dias'
                          : 'Últimos 30 dias'}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 text-white/45 transition-transform ${
                          periodOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {periodOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-2xl border border-[#262626] bg-[#050505] shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter('today')
                            setPeriodOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 ${
                            periodFilter === 'today'
                              ? 'text-emerald-300'
                              : 'text-white/80'
                          }`}
                        >
                          Hoje
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter('yesterday')
                            setPeriodOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-[11px] hover.bg-white/5 hover:bg-white/5 ${
                            periodFilter === 'yesterday'
                              ? 'text-emerald-300'
                              : 'text-white/80'
                          }`}
                        >
                          Ontem
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter('last7')
                            setPeriodOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-[11px] hover:bg.white/5 hover:bg-white/5 ${
                            periodFilter === 'last7'
                              ? 'text-emerald-300'
                              : 'text-white/80'
                          }`}
                        >
                          Últimos 7 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter('last30')
                            setPeriodOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-[11px] hover:bg.white/5 hover:bg-white/5 ${
                            periodFilter === 'last30'
                              ? 'text-emerald-300'
                              : 'text-white/80'
                          }`}
                        >
                          Últimos 30 dias
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ORDEM */}
                  <button
                    type="button"
                    onClick={() => setSortDesc((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#080808] px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/5 transition"
                  >
                    <ArrowDownUp className="h-3 w-3" />
                    {sortDesc
                      ? 'Mais recentes primeiro'
                      : 'Mais antigos primeiro'}
                  </button>
                </div>
              </div>

        

     {loadingSales ? (
  <div className="h-40 rounded-2xl border border-[#202020] bg-[#080808]" />
) : filteredOrders.length === 0 ? (
  <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
    Nenhuma venda encontrada com os filtros atuais.
    <br />
    <span className="text-white/45">
      Ajuste o período, o parceiro ou o status para visualizar outras movimentações.
    </span>
  </div>
) : (
  <>
    <div className="overflow-hidden rounded-2xl border border-[#202020] bg-[#080808]">
      <table className="min-w-full border-collapse text-[11px]">
        <thead className="bg-black/40 text-white/50">
          <tr>
            <th className="px-4 py-2 text-left font-normal">Site / parceiro</th>
            <th className="px-4 py-2 text-left font-normal">Valor / lucro / sua parte</th>
            <th className="px-4 py-2 text-center font-normal">Pagamento</th>
            <th className="px-4 py-2 text-center font-normal">Quando</th>
            <th className="px-4 py-2 text-center font-normal">Status</th>
          </tr>
        </thead>

     <tbody>
  {paginatedOrders.map((o) => (
  <tr
  key={o.id}
  className="border-t border-[#262626] hover:bg-white/[0.02] transition-colors"
>
 {/* COLUNA – CLIENTE / PARCEIRO / GATEWAY */}
<td className="px-4 py-3 align-top">
  <div className="flex flex-col gap-1">
    {/* Nome do cliente */}
    <span className="text-[11px] font-medium text-white/90">
      {o.customerName || 'Cliente sem nome'}
    </span>

    {/* Site + parceiro + gateway */}
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <span className="text-white/50">
        Parceiro:{' '}
        <span className="font-medium text-white/75">
          {o.partnerName || '—'}
        </span>
      </span>
    </div>

    {/* ID da transação (aqui você pode depois separar por gateway se quiser) */}
    {o.buckpayOrderId && (
      <span className="text-[9px] text-white/35">
        Transação: {o.buckpayOrderId}
      </span>
    )}
  </div>
</td>

{/* COLUNA – VALOR */}
<td className="px-4 py-3 align-middle">
  <div className="text-[10px] flex flex-col justify-center h-full">

    {o.status === 'paid' ? (
      <span className="text-white/80">
        Cliente pagou: <strong>{formatCurrency(o.amount)}</strong>
      </span>
    ) : (
      <span className="text-white/75">
        Valor do pedido: <strong>{formatCurrency(o.amount)}</strong>
      </span>
    )}

  </div>
</td>


  {/* o resto da linha continua igual */}
  <td className="px-4 py-3 text-center align-middle">
    <div className="flex flex-col items-center gap-0.5 text-[10px] text-white/60">
      {o.paymentMethod === 'pix' && (
        <>
          <QrCode className="h-3 w-3 text-emerald-300" /> Pix
        </>
      )}
      {o.paymentMethod === 'card' && (
        <>
          <CreditCard className="h-3 w-3 text-white/70" /> Cartão
        </>
      )}
      {o.paymentMethod === 'boleto' && (
        <>
          <Receipt className="h-3 w-3 text-white/70" /> Boleto
        </>
      )}
    </div>
  </td>

  <td className="px-4 py-3 text-center text-[10px] text-white/55">
    {formatDateTime(o.createdAt)}
  </td>

  <td className="px-4 py-3 text-center">
    <OrderStatusPill status={o.status} />
  </td>
</tr>

  ))}
</tbody>

      </table>
    </div>

    {/* PAGINAÇÃO NO FINAL DA TABELA */}
    <div className="flex justify-end mt-4 pr-1">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#080808] px-4 py-2 text-[11px] text-white/65">

        <span className="text-white/50">
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-full border text-[10px] transition ${
            currentPage === 1
              ? 'border-transparent text-white/25 cursor-not-allowed'
              : 'border-white/10 text-white/80 hover:bg-white/5'
          }`}
        >
          Anterior
        </button>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-full border text-[10px] transition ${
            currentPage === totalPages
              ? 'border-transparent text-white/25 cursor-not-allowed'
              : 'border-white/10 text-white/80 hover:bg-white/5'
          }`}
        >
          Próxima
        </button>
      </div>
    </div>
  </>
)}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

/* COMPONENTES AUXILIARES */

type ResumoCardProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  accent?: boolean
}

function ResumoCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: ResumoCardProps) {
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
          <p className="text-[10px] leading-relaxed text-white/40">{hint}</p>
        )}
      </div>
    </div>
  )
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  const map = {
    paid: {
      label: 'Pago',
      className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      Icon: CheckCircle2,
    },
    pending: {
      label: 'Pendente',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      Icon: Clock,
    },
    med: {
      label: 'Estornado',
      className: 'border-red-500/40 bg-red-500/10 text-red-300',
      Icon: XCircle,
    },
  }[status]

  const IconComp = map.Icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${map.className}`}
    >
      <IconComp className="h-3 w-3" />
      {map.label}
    </span>
  )
}
