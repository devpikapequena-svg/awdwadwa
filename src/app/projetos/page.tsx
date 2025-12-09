// src/app/projetos/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  Users,
  Globe2,
  ArrowUpRight,
  Edit3,
  Search,
  Link as LinkIcon,
} from 'lucide-react'

type ProjectStatus = 'active' | 'paused' | 'no_sales'

type Project = {
  id: string
  siteSlug: string
  partnerName: string
  siteName: string
  domain: string
  buckpayStoreId: string | null
  utmBase: string | null
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  status: ProjectStatus
  lastOrderAt: string | null
}

type UserMe = {
  id: string
  name: string
  email: string
  plan?: string
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

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProjetosPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [projects, setProjects] = useState<Project[]>([])
  const [filtered, setFiltered] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({
    partnerName: '',
    siteName: '',
    domain: '',
    buckpayStoreId: '',
    utmBase: '',
  })

  // ====== ADD SITE MODAL ======
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    siteSlug: '',
    siteName: '',
    partnerName: '',
    domain: '',
    buckpayStoreId: '',
    utmBase: '',
  })

  // ====== LOAD USER (AUTH GUARD) ======
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

  // ====== LOAD PROJECTS (só depois de ter user) ======
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/projetos', {
          credentials: 'include',
        })

        if (!res.ok) {
          console.error('Erro ao buscar projetos')
          if (res.status === 401 || res.status === 403) {
            router.replace('/login')
          }
          return
        }

        const data = await res.json()
        setProjects(data)
        setFiltered(data)
      } catch (e) {
        console.error('Erro ao carregar projetos', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, router])

  // ====== SEARCH ======
  useEffect(() => {
    const term = search.toLowerCase().trim()
    if (!term) {
      setFiltered(projects)
      return
    }

    setFiltered(
      projects.filter((p) => {
        return (
          p.siteSlug.toLowerCase().includes(term) ||
          p.siteName.toLowerCase().includes(term) ||
          p.partnerName.toLowerCase().includes(term) ||
          (p.domain || '').toLowerCase().includes(term)
        )
      }),
    )
  }, [search, projects])

  // ====== KPIs ======
  const kpis = useMemo(() => {
    const totalSites = projects.length
    const totalOrders = projects.reduce((acc, p) => acc + p.totalOrders, 0)
    const totalGross = projects.reduce((acc, p) => acc + p.totalGross, 0)
    const myCommissionTotal = projects.reduce(
      (acc, p) => acc + p.myCommissionTotal,
      0,
    )

    return {
      totalSites,
      totalOrders,
      totalGross: Number(totalGross.toFixed(2)),
      myCommissionTotal: Number(myCommissionTotal.toFixed(2)),
    }
  }, [projects])

  // ====== OPEN EDIT PANEL ======
  const openEdit = (project: Project) => {
    setSelected(project)
    setEditForm({
      partnerName: project.partnerName || '',
      siteName: project.siteName || project.siteSlug,
      domain: project.domain || '',
      buckpayStoreId: project.buckpayStoreId || '',
      utmBase: project.utmBase || '',
    })
  }

  const closeEdit = () => {
    setSelected(null)
  }

  // ====== SAVE EDIT ======
  const handleSave = async () => {
    if (!selected) return
    try {
      setSaving(true)
      const res = await fetch(`/api/projetos/${selected.siteSlug}/partner`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          partnerName: editForm.partnerName,
          siteName: editForm.siteName,
          domain: editForm.domain,
          buckpayStoreId: editForm.buckpayStoreId || null,
          utmBase: editForm.utmBase || null,
        }),
      })

      if (!res.ok) {
        console.error('Erro ao salvar parceiro')
        if (res.status === 401 || res.status === 403) {
          router.replace('/login')
        }
        return
      }

      const updated = await res.json()

      // sinc com lista local
      setProjects((prev) =>
        prev.map((p) =>
          p.siteSlug === selected.siteSlug
            ? {
                ...p,
                partnerName: updated.partnerName || '',
                siteName: updated.siteName || p.siteSlug,
                domain: updated.domain || '',
                buckpayStoreId: updated.buckpayStoreId || null,
                utmBase: updated.utmBase || null,
              }
            : p,
        ),
      )

      setSelected((prev) =>
        prev
          ? {
              ...prev,
              partnerName: updated.partnerName || '',
              siteName: updated.siteName || prev.siteSlug,
              domain: updated.domain || '',
              buckpayStoreId: updated.buckpayStoreId || null,
              utmBase: updated.utmBase || null,
            }
          : prev,
      )
    } catch (e) {
      console.error('Erro ao salvar parceiro', e)
    } finally {
      setSaving(false)
    }
  }

  // ====== ADD SITE HANDLER ======
  const handleAddSite = async () => {
    if (!addForm.siteSlug || !addForm.siteName || !addForm.partnerName) return

    try {
      setAdding(true)
      const res = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          siteSlug: addForm.siteSlug.trim(),
          siteName: addForm.siteName.trim(),
          partnerName: addForm.partnerName.trim(),
          domain: addForm.domain.trim(),
          buckpayStoreId: addForm.buckpayStoreId.trim() || null,
          utmBase: addForm.utmBase.trim() || null,
        }),
      })

      if (!res.ok) {
        console.error('Erro ao adicionar site')
        if (res.status === 401 || res.status === 403) {
          router.replace('/login')
        }
        return
      }

      const created: Project = await res.json()

      setProjects((prev) => [...prev, created])
      setFiltered((prev) => [...prev, created])

      setShowAddModal(false)
      setAddForm({
        siteSlug: '',
        siteName: '',
        partnerName: '',
        domain: '',
        buckpayStoreId: '',
        utmBase: '',
      })
    } catch (e) {
      console.error('Erro ao adicionar site', e)
    } finally {
      setAdding(false)
    }
  }

  const renderStatusPill = (status: ProjectStatus) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-[2px] text-[11px] font-medium text-emerald-400">
          • ativo
        </span>
      )
    }
    if (status === 'paused') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-[2px] text-[11px] font-medium text-amber-300">
          • pausado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-[2px] text-[11px] font-medium text-white/45">
        • sem vendas
      </span>
    )
  }

  // ====== GUARD: enquanto carrega auth, só a bolinha ======
  if (loadingUser) {
    return <FullscreenLoader />
  }

  return (
    <>
      <div className="min-h-screen bg-[#070707] text-white">
        {/* SIDEBAR FIXO */}
        <Sidebar
          user={
            user || {
              id: '',
              name: '',
              email: '',
            }
          }
        />

        {/* CONTEÚDO COM ESPAÇO PRO SIDEBAR NO DESKTOP */}
        <main className="px-6 py-8 md:px-10 md:py-10 md:ml-64">
          {/* layout principal + painel lateral */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* COLUNA PRINCIPAL */}
            <div className="flex-1">
              {/* HEADER */}
              <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="mt-2 text-[24px] md:text-[26px] font-semibold">
                    Parceiros & sites
                  </h1>
                  <p className="mt-1 text-xs text-white/45 max-w-xl">
                    Visualize o desempenho de cada site parceiro, acompanhe vendas,
                    comissões e configure dados como domínio, nome do parceiro.
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                  <div className="relative w-full md:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por site, parceiro ou domínio..."
                      className="w-full rounded-lg border border-[#151515] bg-[#050505] py-2 pl-8 pr-3 text-[11px] text-white/80 placeholder:text-white/35 outline-none focus:border-white/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90"
                  >
                    + Adicionar site
                  </button>
                </div>
              </header>

              {/* KPI CARDS */}
              <section className="mb-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-[#151515] bg-[#050505] px-4 py-4">
                  <p className="text-xs font-medium text-white/60">
                    Sites parceiros
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-xl font-semibold">{kpis.totalSites}</p>
                    <Users className="h-4 w-4 text-white/30" />
                  </div>
                  <p className="mt-3 text-[11px] text-white/45">
                    Total de projetos com ao menos uma venda registrada.
                  </p>
                </div>

                <div className="rounded-xl border border-[#151515] bg-[#050505] px-4 py-4">
                  <p className="text-xs font-medium text-white/60">
                    Pedidos aprovados
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-xl font-semibold">
                      {kpis.totalOrders.toLocaleString('pt-BR')}
                    </p>
                    <ArrowUpRight className="h-4 w-4 text-white/30" />
                  </div>
                  <p className="mt-3 text-[11px] text-white/45">
                    Volume total de pedidos pagos.
                  </p>
                </div>

                <div className="rounded-xl border border-[#151515] bg-[#050505] px-4 py-4">
                  <p className="text-xs font-medium text-white/60">
                    Faturamento bruto
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {formatCurrency(kpis.totalGross)}
                  </p>
                  <p className="mt-3 text-[11px] text-white/45">
                    Soma do faturamento bruto de todos os sites.
                  </p>
                </div>

                <div className="rounded-xl border border-[#151515] bg-[#050505] px-4 py-4">
                  <p className="text-xs font-medium text-white/60">
                    Minha comissão total
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {formatCurrency(kpis.myCommissionTotal)}
                  </p>
                  <p className="mt-3 text-[11px] text-white/45">
                    30% do faturamento líquido agregado (share Exec).
                  </p>
                </div>
              </section>

              {/* TABELA DE PROJETOS */}
              <section className="border border-[#151515] rounded-xl bg-[#050505] px-6 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-white/90">
                      Sites conectados
                    </p>
                    <p className="text-[11px] text-white/45">
                      Clique em um site para editar dados do parceiro, domínio ou
                      parâmetros de rastreio.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/5 bg-black/40 px-3 py-1 text-[10px] text-white/45">
                    {filtered.length} site(s) exibidos
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-white/5">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full border-collapse text-[11px]">
                      <thead className="bg-[#050505] text-white/40">
                        <tr>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-left font-medium">
                            Site / parceiro
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-left font-medium">
                            Domínio
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-right font-medium">
                            Pedidos
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-right font-medium">
                            Faturamento bruto
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-right font-medium">
                            Comissão Exec
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-left font-medium">
                            Última venda
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-right font-medium">
                            Status
                          </th>
                          <th className="sticky top-0 z-10 border-b border-white/5 px-4 py-2 text-right font-medium">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-6 text-center text-[11px] text-white/40"
                            >
                              Nenhum projeto encontrado para o filtro atual.
                            </td>
                          </tr>
                        )}

                        {filtered.map((p) => (
                          <tr
                            key={p.siteSlug}
                            className="border-t border-white/5 bg-[#050505] rounded-xl hover:bg-[#0b0b0b] transition-colors"
                          >
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-medium text-white">
                                  {p.siteName || p.siteSlug}
                                </span>
                                <span className="text-[10px] text-white/45">
                                  {p.partnerName || 'Parceiro não configurado'}
                                </span>
                                <span className="text-[10px] text-white/30">
                                  slug: {p.siteSlug}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                                <Globe2 className="h-3 w-3 text-white/35" />
                                {p.domain ? (
                                  <a
                                    href={
                                      p.domain.startsWith('http')
                                        ? p.domain
                                        : `https://${p.domain}`
                                    }
                                    target="_blank"
                                    className="inline-flex items-center gap-1 hover:underline"
                                    rel="noreferrer"
                                  >
                                    {p.domain}
                                    <ArrowUpRight className="h-3 w-3 text-white/40" />
                                  </a>
                                ) : (
                                  <span className="text-white/35">
                                    Não definido
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right align-middle text-[11px] text-white/80">
                              {p.totalOrders.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right align-middle text-[11px] text-white/80">
                              {formatCurrency(p.totalGross)}
                            </td>
                            <td className="px-4 py-3 text-right align-middle text-[11px] text-emerald-300">
                              {formatCurrency(p.myCommissionTotal)}
                            </td>
                            <td className="px-4 py-3 align-middle text-[10px] text-white/60">
                              {formatDateTime(p.lastOrderAt)}
                            </td>
                            <td className="px-4 py-3 align-middle text-right">
                              {renderStatusPill(p.status)}
                            </td>
                            <td className="px-4 py-3 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/5"
                              >
                                <Edit3 className="h-3 w-3" />
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {loading && (
                <p className="mt-4 text-xs text-white/40">
                  Carregando dados dos projetos...
                </p>
              )}
            </div>

            {/* SIDE PANEL DE EDIÇÃO (coluna direita) */}
            {selected && (
              <aside className="w-full lg:w-[360px] rounded-xl border border-[#151515] bg-[#050505] px-5 py-6 animate-slideInRight">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-white/90">
                      Configurações do site
                    </p>
                    <p className="text-[11px] text-white/45">
                      Ajuste dados de exibição e rastreio para{' '}
                      <span className="font-semibold text-white/80">
                        {selected.siteName || selected.siteSlug}
                      </span>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="text-[11px] text-white/45 hover:text-white/80"
                  >
                    fechar
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-[11px]">
                  <div>
                    <label className="mb-1 block text-xs text-white/55">
                      Nome do parceiro
                    </label>
                    <input
                      value={editForm.partnerName}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          partnerName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/55">
                      Nome do site
                    </label>
                    <input
                      value={editForm.siteName}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          siteName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                    />
                    <p className="mt-1 text-[10px] text-white/35">
                      Usado em listagens internas e relatórios.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/55">
                      Domínio
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/35" />
                        <input
                          value={editForm.domain}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              domain: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-[#202020] bg-[#080808] py-2 pl-8 pr-3 text-[11px] text-white/80 outline-none focus:border-white/25"
                          placeholder="exemplo.com ou https://exemplo.com"
                        />
                      </div>
                      {editForm.domain && (
                        <a
                          href={
                            editForm.domain.startsWith('http')
                              ? editForm.domain
                              : `https://${editForm.domain}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white/60 hover:bg-white/5"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-white/35">
                      Usado para identificar o site e facilitar acesso rápido.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/60 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>

      {/* MODAL ADICIONAR SITE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#050505] px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-medium text-white/90">
                Adicionar novo site
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[11px] text-white/45 hover:text-white/80"
              >
                fechar
              </button>
            </div>

            <div className="space-y-3 text-[11px]">
              <div>
                <label className="mb-1 block text-xs text-white/55">
                  Slug do site
                </label>
                <input
                  value={addForm.siteSlug}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, siteSlug: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/55">
                  Nome do site
                </label>
                <input
                  value={addForm.siteName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/55">
                  Nome do parceiro
                </label>
                <input
                  value={addForm.partnerName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, partnerName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/55">
                  Domínio (opcional)
                </label>
                <input
                  value={addForm.domain}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, domain: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#202020] bg-[#080808] px-3 py-2 text-[11px] text-white/80 outline-none focus:border-white/25"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/60 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddSite}
                disabled={adding}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? 'Adicionando...' : 'Adicionar site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* animação do painel lateral */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0px);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.18s ease-out forwards;
        }
      `}</style>
    </>
  )
}
