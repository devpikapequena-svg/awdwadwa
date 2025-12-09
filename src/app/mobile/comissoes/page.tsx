// app/mobile/comissoes/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  BarChart2,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/* ============================ */
/*  LOADER FULLSCREEN BOLINHA   */
/* ============================ */

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="relative h-10 w-10">
        {/* círculo externo suave */}
        <div className="absolute inset-0 rounded-full border border-white/10" />

        {/* círculo traçado girando */}
        <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent border-dashed animate-spin" />
      </div>
    </div>
  )
}

/* ============================ */
/*  LOADER LOGIN EXPIRADO       */
/* ============================ */

function ExpiredRedirectSpinner() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/mobile/login')
    }, 3500)

    return () => clearTimeout(timer)
  }, [router])

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

/* ============================ */
/*          TYPES               */
/* ============================ */

type Period = 'today' | 'yesterday' | 'last7' | 'last30' | 'all'

type PartnerPayment = {
  id: string
  amount: number
  note: string
  createdAt: string
}

type PartnerNotasRow = {
  partnerId: string
  partnerName: string
  siteName: string
  siteSlug: string

  totalGross: number
  totalNet: number
  totalNetBeforeAds: number
  adsTotal: number

  myCommission: number
  totalPaid: number
  balance: number

  payments: PartnerPayment[]
}

type NotasResponse = {
  partners: PartnerNotasRow[]
}

type UserType = {
  id: string
  name: string
  email: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number | null | undefined, hide: boolean) {
  if (hide) return '••••••'
  if (value == null) return 'R$ 0,00'
  return currencyFormatter.format(value)
}

export default function MobileComissoesPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserType | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  const [period, setPeriod] = useState<Period>('today')
  const [rows, setRows] = useState<PartnerNotasRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showValues, setShowValues] = useState(true)

  /* ========= detectar se é mobile ========= */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ========= buscar usuário (auth/me) ========= */
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

  // carregar dados
  useEffect(() => {
    async function loadNotas() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/notas?period=${period}`)
        if (!res.ok) {
          throw new Error('Erro ao carregar dados')
        }

        const data: NotasResponse = await res.json()
        setRows(data.partners || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Erro ao carregar dados')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    loadNotas()
  }, [period])

  // agregados gerais de resumo
  const totalNetSum = useMemo(
    () => rows.reduce((acc, r) => acc + (r.totalNet || 0), 0),
    [rows],
  )

  const totalMyCommission = useMemo(
    () => rows.reduce((acc, r) => acc + (r.myCommission || 0), 0),
    [rows],
  )

  const totalPartnerShare = useMemo(
    () => totalNetSum - totalMyCommission,
    [totalNetSum, totalMyCommission],
  )

  const partnersCount = rows.length

  /* ========= GUARDS ========= */

  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black px-6 py-7 text-center">
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa é a interface pensada para celular. Acesse pelo smartphone ou
            use o painel normal no desktop.
          </p>
        </div>
      </main>
    )
  }

  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  if (!user) {
    return <ExpiredRedirectSpinner />
  }

  if (loading && rows.length === 0) {
    return <FullscreenLoader />
  }

  // ========= TELA NORMAL =========
  return (
    <>
      <div className="flex min-h-screen flex-col bg-black text-white">
        {/* HEADER / HERO */}
        <section className="relative z-10 w-full px-6 pt-8 pb-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="mt-1 text-[22px] font-semibold">Resumo</h1>
            </div>

            <button
              type="button"
              onClick={() => setShowValues((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5"
            >
              {showValues ? (
                <Eye className="h-4 w-4 text-white/70" />
              ) : (
                <EyeOff className="h-4 w-4 text-white/70" />
              )}
            </button>
          </div>

          {/* filtro de período */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] text-white/70">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'last7', label: '7 dias' },
                { id: 'last30', label: '30 dias' },
                { id: 'all', label: 'Tudo' },
              ] as { id: Period; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`rounded-full border px-3 py-1 whitespace-nowrap ${
                  period === opt.id
                    ? 'border-white text-white bg-white/10'
                    : 'border-white/10 text-white/60 bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* RESUMO GERAL POR PARCEIRO */}
        <section className="relative z-10 px-6 pb-3">
          <div className="rounded-2xl bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm">
            <p className="text-[11px] text-white/55">Resumo por parceiro</p>
            <p className="mt-1 text-[22px] font-semibold">
              {formatCurrency(totalNetSum, !showValues)}
            </p>

            <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
              <span>{partnersCount} parceiro(s) no período</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
              <div>
                <p className="text-[10px] text-white/45">Parte dos parceiros (70%)</p>
                <p className="mt-0.5">
                  {formatCurrency(totalPartnerShare, !showValues)}
                </p>
              </div>
              <div className="h-9 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] text-white/45">
                  Sua parte (30%)
                </p>
                <p className="mt-0.5">
                  {formatCurrency(totalMyCommission, !showValues)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LISTA DE PARCEIROS - RESUMO */}
        <section className="relative z-10 flex-1 px-6 pb-24">
          {loading && rows.length > 0 && (
            <p className="text-[11px] text-white/50">Carregando resumo...</p>
          )}

          {error && !loading && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="text-[11px] text-white/45">
              Nenhum dado encontrado para o período selecionado.
            </p>
          )}

          <div className="mt-2 space-y-3">
            {rows.map((row) => {
              const partnerShare = (row.totalNet || 0) - (row.myCommission || 0)

              return (
                <div
                  key={row.partnerId}
                  className="rounded-2xl bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium">
                        {row.partnerName}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {row.siteName}
                      </p>
                    </div>

                    <div className="inline-flex rounded-full border px-2 py-[2px] text-[10px] border-white/15 bg-white/5 text-white/60">
                      Resumo do período
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <p className="text-[10px] text-white/45">
                        Faturamento líquido
                      </p>
                      <p className="mt-0.5 font-medium">
                        {formatCurrency(row.totalNet, !showValues)}
                      </p>
                    </div>
   <div>
                      <p className="text-[10px] text-white/45">
                        Ads investidos
                      </p>
                      <p className="mt-0.5">
                        {formatCurrency(row.adsTotal, !showValues)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/45">
                        Parte do parceiro (70%)
                      </p>
                      <p className="mt-0.5 font-medium">
                        {formatCurrency(partnerShare, !showValues)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/45">
                        Sua parte (30%)
                      </p>
                      <p className="mt-0.5 font-medium">
                        {formatCurrency(row.myCommission, !showValues)}
                      </p>
                    </div>
                 
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* ====== BOTTOM NAV FIXO ====== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/95 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around px-4 py-6 text-[11px]">
            <Link
              href="/mobile"
              className="flex flex-col items-center gap-1 text-white/60"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/mobile/comissoes"
              className="flex flex-col items-center gap-1 text-white"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Resumo</span>
            </Link>

            <Link
              href="/mobile/settings"
              className="flex flex-col items-center gap-1 text-white/60"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
