'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { Plus, ExternalLink, Clock, Users, Globe2 } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

type ProjectStatus = 'active' | 'paused' | 'no_sales'

type PartnerProject = {
  id: string
  partnerName: string
  siteName: string
  domain: string
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  status: ProjectStatus
  lastOrderAt: string | null
}

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [projects, setProjects] = useState<PartnerProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) setUser(null)
        else setUser(await res.json())
      } catch {
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projetos', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) return setProjects([])

        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch {
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [user])

  if (loadingUser)
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

  if (!user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#191919] bg-[#080808] px-6 py-7 text-center">
          <p className="text-sm font-semibold">Sessão expirada</p>
          <p className="mt-2 text-xs text-white/55">
            Faça login novamente para acessar seus sites e parceiros.
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

  const formatCurrency = (value: number | null | undefined) =>
    value == null
      ? 'R$ 0,00'
      : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatDateTime = (iso: string | null) => {
    if (!iso) return 'Sem vendas ainda'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Sem vendas ainda'

    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalProjects = projects.length
  const totalOrders = projects.reduce((acc, p) => acc + (p.totalOrders || 0), 0)
  const totalGrossAll = projects.reduce(
    (acc, p) => acc + (p.totalGross || 0),
    0,
  )
  const totalMyCommissionAll = projects.reduce(
    (acc, p) => acc + (p.myCommissionTotal || 0),
    0,
  )

  const activeProjects = projects.filter((p) => p.status === 'active').length

  // ordenar sites pela última venda (mais recente primeiro)
  const orderedProjects = [...projects].sort((a, b) => {
    const ta = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0
    const tb = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0
    return tb - ta
  })

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {/* HEADER PREMIUM IGUAL AS OUTRAS PÁGINAS */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-6 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            {/* linha glow topo */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            {/* glow canto */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Parceiros &amp; sites
                </h1>
                <p className="mt-1 max-w-md text-[12px] text-white/60">
                  Organize os sites que você opera com parceiros, com visão de
                  domínio, receita por projeto e histórico de vendas.
                </p>

                {totalProjects > 0 && (
                  <p className="mt-2 text-[11px] text-white/45">
                    Você está operando{' '}
                    <span className="font-semibold text-white/80">
                      {totalProjects} {totalProjects === 1 ? 'site' : 'sites'}
                    </span>
                    , somando{' '}
                    <span className="font-semibold text-white/80">
                      {totalOrders} pedidos
                    </span>
                    .
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-3 text-xs md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-inner">
                    <Globe2 className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">
                      Operação de sites
                    </span>
                    <span className="text-[11px] text-white/80">
                      {activeProjects} site(s) ativos no momento
                    </span>
                  </div>
                </div>

                <Link
                  href="/projetos/novo"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-black hover:bg-emerald-400 transition"
                >
                  <Plus className="h-3 w-3" />
                  Cadastrar / editar parceiro
                </Link>
              </div>
            </div>
          </header>

          {/* KPIs (cards) */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4 mt-1">
            <ResumoCard
              icon={Globe2}
              label="Total de sites"
              value={String(totalProjects)}
              hint="Quantidade total de sites cadastrados com parceiros."
            />
            <ResumoCard
              icon={Clock}
              label="Pedidos somados"
              value={String(totalOrders)}
              hint="Total de pedidos processados em todos os sites."
            />
            <ResumoCard
              icon={Users}
              label="Receita consolidada"
              value={formatCurrency(totalGrossAll)}
              hint="Soma da receita bruta de todos os projetos."
            />
            <ResumoCard
              icon={Users}
              label="Sua comissão total"
              value={formatCurrency(totalMyCommissionAll)}
              hint="Quanto desses sites já geraram de comissão total pra você."
              accent
            />
          </section>

          {/* LISTA DE PROJETOS */}
          <section className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-6 md:px-7 md:py-7 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* linha glow topo */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            {/* glow canto */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5">
              <div className="mb-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Sites cadastrados</h2>
                  <p className="mt-1 text-[11px] text-white/55">
                    Cada linha representa um site com parceiro responsável,
                    domínio publicado e desempenho financeiro consolidado.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <Clock className="h-3 w-3" />
                  Atualizado automaticamente conforme novas vendas.
                </div>
              </div>

              {loadingProjects ? (
                <div className="h-40 rounded-2xl border border-[#202020] bg-[#080808]" />
              ) : orderedProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                  Nenhum site cadastrado ainda.
                  <br />
                  <span className="text-white/45">
                    Use o botão{' '}
                    <span className="font-semibold">
                      &quot;Cadastrar / editar parceiro&quot;
                    </span>{' '}
                    para registrar o primeiro site da operação.
                  </span>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#202020] bg-[#080808]">
                  <table className="min-w-full border-collapse text-[11px]">
                    <thead className="bg-black/40 text-white/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-normal">
                          Site
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Parceiro
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Domínio
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Resultados
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Última venda
                        </th>
                        <th className="px-4 py-2 text-center font-normal">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedProjects.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-[#262626] hover:bg-white/[0.02]"
                        >
                          {/* Site */}
                          <td className="px-4 py-3 align-middle">
                            <span className="text-[11px] font-semibold text-white/85">
                              {p.siteName}
                            </span>
                          </td>

                          {/* Parceiro */}
                          <td className="px-4 py-3 align-middle text-center">
                            <span className="text-[10px] text-white/75">
                              {p.partnerName || 'Não definido'}
                            </span>
                          </td>

                          {/* Domínio */}
                          <td className="px-4 py-3 align-middle text-center">
                            {p.domain ? (
                              <a
                                href={
                                  p.domain.startsWith('http')
                                    ? p.domain
                                    : `https://${p.domain}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-300 hover:text-emerald-200"
                              >
                                {p.domain.replace(/^https?:\/\//, '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-white/45">
                                —
                              </span>
                            )}
                          </td>

                          {/* Resultados */}
                          <td className="px-4 py-3 align-middle text-center">
                            <div className="flex flex-col items-center gap-0.5 text-[10px]">
                              <span className="text-white/80">
                                Receita:{' '}
                                <strong>
                                  {formatCurrency(p.totalGross)}
                                </strong>
                              </span>
                              <span className="text-emerald-300">
                                Sua parte:{' '}
                                <strong>
                                  {formatCurrency(p.myCommissionTotal)}
                                </strong>
                              </span>
                              <span className="text-white/55">
                                {p.totalOrders} pedidos
                              </span>
                            </div>
                          </td>

                          {/* Última venda */}
                          <td className="px-4 py-3 align-middle text-center">
                            <span className="text-[10px] text-white/55">
                              {formatDateTime(p.lastOrderAt)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 align-middle text-center">
                            <ProjectStatusPill status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const map = {
    active: {
      label: 'Ativo',
      className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    paused: {
      label: 'Pausado',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    no_sales: {
      label: 'Sem vendas ainda',
      className: 'border-[#555]/40 bg-[#555]/10 text-[#cfcfcf]',
    },
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${map.className}`}
    >
      {map.label}
    </span>
  )
}
