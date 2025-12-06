// app/mobile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet2,
  ShoppingBag,
  LineChart as LineChartIcon,
  Bell,
  Settings,
  Home,
  QrCode,
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

type OrderStatus = 'paid' | 'pending' | 'refunded'

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
  gateway?: 'buckpay' | 'blackcat' | string
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

export default function MobileDashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [orders, setOrders] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(true)

  const [periodFilter, setPeriodFilter] =
    useState<'today' | 'yesterday' | 'last7' | 'last30'>('today')

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  // Detectar se é mobile (só pra evitar usar esse layout no desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Buscar usuário
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

  // Buscar vendas (período selecionado)
  useEffect(() => {
    if (!user) return

    const fetchSales = async () => {
      try {
        setLoadingSales(true)
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

    fetchSales()
  }, [user, periodFilter])

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

  const paidOrders = orders.filter((o) => o.status === 'paid')
  const paidSummary = (() => {
    const totalOrdersPaid = paidOrders.length
    const totalGrossPaid = paidOrders.reduce((acc, o) => acc + o.amount, 0)
    const totalNetPaid = paidOrders.reduce((acc, o) => acc + o.netAmount, 0)
    const myCommissionTotalPaid = paidOrders.reduce(
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

  const periodLabel = summary?.periodLabel || 'Hoje'

  if (isMobile === false) {
    // Se abrir em desktop, mostra só um aviso
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa é a interface pensada para celular. Acesse pelo smartphone ou
            use a página de vendas normal no desktop.
          </p>
        </div>
      </main>
    )
  }

  if (loadingUser || isMobile === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/70" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar seu painel.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
          >
            Ir para login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#050505] text-white">
      {/* HEADER MOBILE */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#171717] bg-gradient-to-r from-[#050505] via-[#070707] to-[#050505] px-4 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <Wallet2 className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/50">Bem-vindo(a)</span>
            <span className="text-sm font-semibold leading-tight">
              {user.name || 'Eqp Dashboard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Bell className="h-3.5 w-3.5 text-white/70" />
          </button>
          <button
            onClick={() => router.push('/mobile/settings')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40"
          >
            <Settings className="h-3.5 w-3.5 text-white/70" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO SCROLLÁVEL */}
      <section className="flex-1 overflow-y-auto pb-20">
        <div className="space-y-5 px-4 pt-4">
          {/* CARD RESUMO PRINCIPAL */}
          <div className="relative rounded-2xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#070707] to-[#030303] p-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-20 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-white/50">
                    Resumo do período
                  </span>
                  <span className="text-sm font-semibold">
                    {periodLabel}
                  </span>
                </div>

                {/* seletor simples de período no mobile */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[11px]">
                  <button
                    className={`rounded-full px-2 py-0.5 ${
                      periodFilter === 'today'
                        ? 'bg-white text-black'
                        : 'text-white/60'
                    }`}
                    onClick={() => setPeriodFilter('today')}
                  >
                    Hoje
                  </button>
                  <button
                    className={`rounded-full px-2 py-0.5 ${
                      periodFilter === 'yesterday'
                        ? 'bg-white text-black'
                        : 'text-white/60'
                    }`}
                    onClick={() => setPeriodFilter('yesterday')}
                  >
                    Ontem
                  </button>
                  <button
                    className={`rounded-full px-2 py-0.5 ${
                      periodFilter === 'last7'
                        ? 'bg-white text-black'
                        : 'text-white/60'
                    }`}
                    onClick={() => setPeriodFilter('last7')}
                  >
                    7d
                  </button>
                  <button
                    className={`rounded-full px-2 py-0.5 ${
                      periodFilter === 'last30'
                        ? 'bg-white text-black'
                        : 'text-white/60'
                    }`}
                    onClick={() => setPeriodFilter('last30')}
                  >
                    30d
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <MobileKpiCard
                  icon={ShoppingBag}
                  label="Receita bruta (pagas)"
                  value={formatCurrency(paidSummary.totalGrossPaid)}
                />
                <MobileKpiCard
                  icon={LineChartIcon}
                  label="Lucro líquido (pagas)"
                  value={formatCurrency(paidSummary.totalNetPaid)}
                />
                <MobileKpiCard
                  icon={Wallet2}
                  label="Sua comissão"
                  value={formatCurrency(
                    paidSummary.myCommissionTotalPaid,
                  )}
                  accent
                />
                <MobileKpiCard
                  icon={Receipt}
                  label="Ticket médio"
                  value={
                    paidSummary.averageTicketPaid
                      ? formatCurrency(paidSummary.averageTicketPaid)
                      : 'R$ 0,00'
                  }
                />
              </div>
            </div>
          </div>

          {/* LISTA DE VENDAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">
                Últimas vendas
              </span>
              <span className="text-[11px] text-white/45">
                {orders.length} pedidos
              </span>
            </div>

            {loadingSales ? (
              <div className="space-y-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-4 py-6 text-[11px] text-white/60">
                Nenhuma venda encontrada para este período.
                <br />
                <span className="text-white/45">
                  Quando uma venda for registrada, ela aparece aqui em
                  tempo real.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <MobileOrderCard
                    key={o.id}
                    sale={o}
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BOTTOM NAV MOBILE */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#191919] bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2.5">
          <button
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px]"
            onClick={() => router.push('/mobile')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-emerald-500/20">
              <Home className="h-4 w-4" />
            </div>
            <span className="text-white/90 font-medium">Dashboard</span>
          </button>

          <button
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px]"
            onClick={() => router.push('/vendas')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#101010]">
              <ShoppingBag className="h-4 w-4 text-white/80" />
            </div>
            <span className="text-white/60">Vendas desktop</span>
          </button>

          <button
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px]"
            onClick={() => router.push('/mobile/settings')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#101010]">
              <Settings className="h-4 w-4 text-white/80" />
            </div>
            <span className="text-white/60">Configurações</span>
          </button>
        </div>
      </nav>
    </main>
  )
}

type MobileKpiCardProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: boolean
}

function MobileKpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: MobileKpiCardProps) {
  return (
    <div className="rounded-2xl border border-[#242424] bg-[#050505] px-3 py-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/55">{label}</span>
          <span
            className={`text-sm font-semibold ${
              accent ? 'text-emerald-300' : 'text-white'
            }`}
          >
            {value}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/40 border border-white/10">
          <Icon className="h-3.5 w-3.5 text-white/75" />
        </div>
      </div>
    </div>
  )
}

function OrderStatusPillMobile({ status }: { status: OrderStatus }) {
  const map = {
    paid: {
      label: 'Pago',
      className:
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      Icon: CheckCircle2,
    },
    pending: {
      label: 'Pendente',
      className:
        'border-amber-500/40 bg-amber-500/10 text-amber-300',
      Icon: Clock,
    },
    refunded: {
      label: 'Estornado',
      className: 'border-red-500/40 bg-red-500/10 text-red-300',
      Icon: XCircle,
    },
  }[status]

  const IconComp = map.Icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${map.className}`}
    >
      <IconComp className="h-3 w-3" />
      {map.label}
    </span>
  )
}

function MobileOrderCard({
  sale,
  formatCurrency,
  formatDateTime,
}: {
  sale: Sale
  formatCurrency: (v: number | null | undefined) => string
  formatDateTime: (iso: string) => string
}) {
  return (
    <div className="rounded-2xl border border-[#222222] bg-[#070707] p-3.5 shadow-[0_0_18px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-white/90">
            {sale.customerName || 'Cliente sem nome'}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/60">
            {sale.siteName && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/70">
                {sale.siteName}
              </span>
            )}

            <span className="text-white/50">
              Parceiro:{' '}
              <span className="font-medium text-white/75">
                {sale.partnerName || '—'}
              </span>
            </span>

            {sale.gateway && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${
                  sale.gateway === 'blackcat'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : sale.gateway === 'buckpay'
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                    : 'border-white/15 bg-white/5 text-white/70'
                }`}
              >
                {sale.gateway === 'blackcat'
                  ? 'Blackcat'
                  : sale.gateway === 'buckpay'
                  ? 'Buckpay'
                  : sale.gateway}
              </span>
            )}
          </div>

          {sale.buckpayOrderId && (
            <span className="text-[9px] text-white/35">
              Transação: {sale.buckpayOrderId}
            </span>
          )}
        </div>

        <OrderStatusPillMobile status={sale.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 text-[10px]">
          <span className="text-white/60">
            {sale.status === 'paid' ? 'Cliente pagou' : 'Valor do pedido'}
          </span>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(sale.amount)}
          </span>

          {sale.status === 'paid' && (
            <span className="text-[10px] text-emerald-300">
              Sua parte:{' '}
              <strong>{formatCurrency(sale.myCommission)}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-white/55">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
            {sale.paymentMethod === 'pix' && (
              <>
                <QrCode className="h-3 w-3 text-emerald-300" />
                <span>Pix</span>
              </>
            )}
            {sale.paymentMethod === 'card' && (
              <>
                <CreditCard className="h-3 w-3 text-white/80" />
                <span>Cartão</span>
              </>
            )}
            {sale.paymentMethod === 'boleto' && (
              <>
                <Receipt className="h-3 w-3 text-white/80" />
                <span>Boleto</span>
              </>
            )}
          </div>

          <span>{formatDateTime(sale.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-[#1b1b1b] bg-[#050505] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded-full bg-white/5" />
          <div className="h-3 w-1/2 rounded-full bg-white/5" />
        </div>
        <div className="h-5 w-16 rounded-full bg-white/5" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-24 rounded-full bg-white/5" />
        <div className="h-3 w-20 rounded-full bg-white/5" />
      </div>
    </div>
  )
}
