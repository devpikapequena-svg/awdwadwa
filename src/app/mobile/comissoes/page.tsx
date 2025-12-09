// app/mobile/comissoes/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  BarChart2,
  User,
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
    }, 3500) // ~3.5s até ir pra /mobile/login

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

  // modal de repasse
  const [selectedPartner, setSelectedPartner] = useState<PartnerNotasRow | null>(
    null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [repasseAmount, setRepasseAmount] = useState('')
  const [repasseNote, setRepasseNote] = useState('')
  const [repasseRefDate, setRepasseRefDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10), // yyyy-mm-dd
  )
  const [savingRepasse, setSavingRepasse] = useState(false)
  const [repasseError, setRepasseError] = useState<string | null>(null)

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

  // carregar dados de comissões
  useEffect(() => {
    async function loadNotas() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/notas?period=${period}`)
        if (!res.ok) {
          throw new Error('Erro ao carregar comissões')
        }

        const data: NotasResponse = await res.json()
        setRows(data.partners || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Erro ao carregar comissões')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    loadNotas()
  }, [period])

  // agregados gerais
  const totalCommission = useMemo(
    () => rows.reduce((acc, r) => acc + (r.myCommission || 0), 0),
    [rows],
  )

  const totalPaid = useMemo(
    () => rows.reduce((acc, r) => acc + (r.totalPaid || 0), 0),
    [rows],
  )

  const totalBalance = useMemo(
    () => rows.reduce((acc, r) => acc + (r.balance || 0), 0),
    [rows],
  )

  const openRepasseModal = (partner: PartnerNotasRow) => {
    setSelectedPartner(partner)
    setRepasseAmount('')
    setRepasseNote('')
    setRepasseRefDate(new Date().toISOString().slice(0, 10))
    setRepasseError(null)
    setModalOpen(true)
  }

  const closeRepasseModal = () => {
    if (savingRepasse) return
    setModalOpen(false)
    setSelectedPartner(null)
  }

  const handleSaveRepasse = async () => {
    if (!selectedPartner) return

    setRepasseError(null)

    // converte string para número (aceita vírgula)
    const normalized = repasseAmount.replace('.', '').replace(',', '.')
    const value = Number(normalized)

    if (!value || value <= 0) {
      setRepasseError('Informe um valor válido.')
      return
    }

    try {
      setSavingRepasse(true)

      const finalNote = repasseNote
        ? `${repasseNote} (ref: ${repasseRefDate})`
        : `Ref: ${repasseRefDate}`

      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPartner.partnerId,
          amount: value,
          note: finalNote,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar repasse')
      }

      // recarrega tabela após salvar
      const refresh = await fetch(`/api/notas?period=${period}`)
      if (refresh.ok) {
        const data: NotasResponse = await refresh.json()
        setRows(data.partners || [])
      }

      closeRepasseModal()
    } catch (err: any) {
      console.error(err)
      setRepasseError(err.message || 'Erro ao salvar repasse.')
    } finally {
      setSavingRepasse(false)
    }
  }

  /* ========= GUARDS ========= */

  // não é mobile
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

  // carregando user / checando se é mobile
  if (loadingUser || isMobile === null) {
    return <FullscreenLoader />
  }

  // sessão expirada → bolinha + redirect pra /mobile/login
  if (!user) {
    return <ExpiredRedirectSpinner />
  }

  // carregando comissões na PRIMEIRA vez (sem rows ainda)
  if (loading && rows.length === 0) {
    return <FullscreenLoader />
  }

  // ========= TELA NORMAL (MOBILE + AUTENTICADO) =========
  return (
    <>
      <div className="flex min-h-screen flex-col bg-black text-white">
        {/* HEADER / HERO */}
        <section className="relative z-10 w-full px-6 pt-8 pb-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="mt-1 text-[22px] font-semibold">Comissões</h1>
              <p className="mt-1 text-[11px] text-white/45 max-w-xs">
                Acompanhe sua parte nas vendas e registre repasses para cada
                parceiro.
              </p>
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

        {/* RESUMO GERAL */}
        <section className="relative z-10 px-6 pb-3">
          <div className="rounded-2xl bg-white/[0.03] px-4 py-3.5 backdrop-blur-sm">
            <p className="text-[11px] text-white/55">Visão geral dos repasses</p>
            <p className="mt-1 text-[22px] font-semibold">
              {formatCurrency(totalBalance, !showValues)}
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
              <div>
                <p className="text-[11px] text-white/45">
                  Total de comissões geradas
                </p>
                <p className="mt-0.5">
                  {formatCurrency(totalCommission, !showValues)}
                </p>
              </div>
              <div className="h-9 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[11px] text-white/45">Total já repassado</p>
                <p className="mt-0.5">
                  {formatCurrency(totalPaid, !showValues)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LISTA DE PARCEIROS */}
        <section className="relative z-10 flex-1 px-6 pb-24">
          {loading && rows.length > 0 && (
            <p className="text-[11px] text-white/50">
              Carregando comissões...
            </p>
          )}

          {error && !loading && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="text-[11px] text-white/45">
              Nenhum dado de comissão encontrado para o período selecionado.
            </p>
          )}

          <div className="mt-2 space-y-3">
            {rows.map((row) => {
              const saldoPositivo = row.balance > 0

              return (
                <div
                  key={row.partnerId}
                  className="rounded-2xl bg-white/[0.03] px-3.5 py-3.5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium">
                        Parceiro: {row.partnerName}
                      </p>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-2 py-[2px] text-[10px] ${
                        saldoPositivo
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/15 bg-white/5 text-white/60'
                      }`}
                    >
                      Saldo {saldoPositivo ? 'a receber' : 'zerado'}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <p className="text-[10px] text-white/45">
                        Líquido após ads
                      </p>
                      <p className="mt-0.5 font-medium">
                        {formatCurrency(row.totalNet, !showValues)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/45">
                        Sua comissão (30%)
                      </p>
                      <p className="mt-0.5 font-medium">
                        {formatCurrency(row.myCommission, !showValues)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/45">Pago</p>
                      <p className="mt-0.5">
                        {formatCurrency(row.totalPaid, !showValues)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/45">Saldo</p>
                      <p
                        className={`mt-0.5 font-semibold ${
                          saldoPositivo ? 'text-emerald-300' : 'text-white/70'
                        }`}
                      >
                        {formatCurrency(row.balance, !showValues)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10px] text-white/35">
                      Ads: {formatCurrency(row.adsTotal, !showValues)} • Líquido
                      antes dos ads:{' '}
                      {formatCurrency(
                        row.totalNetBeforeAds,
                        !showValues,
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => openRepasseModal(row)}
                      className="text-[11px] font-medium text-white/80 rounded-full border border-white/15 px-3 py-1 bg-white/[0.03]"
                    >
                      Registrar
                    </button>
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
          <div className="flex items-center justify-around px-4 py-4 text-[11px]">
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
              <span>Comissões</span>
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

      {/* MODAL DE REPASSE */}
      {modalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-end justify	center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border border-white/15 bg-[#050505] px-5 pb-6 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-white/50">Registrar repasse</p>
                <p className="text-sm font-semibold">
                  {selectedPartner.siteName}
                </p>
                <p className="text-[10px] text-white/40">
                  Parceiro: {selectedPartner.partnerName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRepasseModal}
                className="text-[11px] text-white/50"
              >
                Fechar
              </button>
            </div>

            <div className="mt-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px]">
              <p className="text-white/40 text-[10px] uppercase tracking-[0.12em]">
                Saldo disponível
              </p>
              <p className="mt-0.5 text-[15px] font-semibold">
                {formatCurrency(selectedPartner.balance, !showValues)}
              </p>
            </div>

            <div className="mt-4 space-y-3 text-[11px]">
              <div>
                <label className="mb-1 block text-white/60">
                  Valor do repasse
                </label>
                <div className="flex items-center rounded-xl border border-white/15 bg-black px-3 py-2">
                  <span className="mr-1 text-white/40 text-[10px]">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="w-full bg-transparent text-[12px] outline-none"
                    value={repasseAmount}
                    onChange={(e) => setRepasseAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-white/60">
                  Data de referência
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-[11px] outline-none"
                  value={repasseRefDate}
                  onChange={(e) => setRepasseRefDate(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-white/60">
                  Observação (opcional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-[11px] outline-none resize-none"
                  placeholder="Ex: repasse referente às vendas de dezembro..."
                  value={repasseNote}
                  onChange={(e) => setRepasseNote(e.target.value)}
                />
              </div>

              {repasseError && (
                <p className="text-[11px] text-red-400">{repasseError}</p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={closeRepasseModal}
                  disabled={savingRepasse}
                  className="flex-1 rounded-xl border border-white/20 bg-transparent py-2 text-[11px] text-white/70"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveRepasse}
                  disabled={savingRepasse}
                  className="flex-1 rounded-xl bg-white text-[11px] font-semibold text-black py-2 disabled:opacity-60"
                >
                  {savingRepasse ? 'Salvando...' : 'Confirmar repasse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
