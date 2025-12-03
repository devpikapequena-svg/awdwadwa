'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Globe2, Link2, Save, User2, Store } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
}

type ProjectStatus = 'active' | 'paused' | 'no_sales'

type PartnerProject = {
  id: string
  siteSlug: string
  partnerName: string
  siteName: string
  domain: string
  buckpayStoreId?: string | null
  utmBase?: string | null
  totalOrders: number
  totalGross: number
  totalNet: number
  myCommissionTotal: number
  status: ProjectStatus
  lastOrderAt: string | null
}

export default function EditPartnerPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [projects, setProjects] = useState<PartnerProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [selectedSlug, setSelectedSlug] = useState<string>('')

  // campos do formulário
  const [siteName, setSiteName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [domain, setDomain] = useState('')
  const [buckpayStoreId, setBuckpayStoreId] = useState('')

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // ===== BUSCA USER =====
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

  // ===== BUSCA PROJETOS =====
  useEffect(() => {
    if (!user) return

    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projetos', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setProjects([])
          return
        }

        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Erro ao buscar projetos', err)
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [user])

  // ===== QUANDO TROCA O SITE, PREENCHE OS CAMPOS =====
  useEffect(() => {
    if (!selectedSlug) return
    const p = projects.find((proj) => proj.siteSlug === selectedSlug)
    if (!p) return

    setSiteName(p.siteName || p.siteSlug)
    setPartnerName(p.partnerName || '')
    setDomain(p.domain || '')
    setBuckpayStoreId(p.buckpayStoreId || '')
  }, [selectedSlug, projects])

  // ===== SALVAR =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!selectedSlug) {
      setErrorMessage('Selecione primeiro o site que você quer editar.')
      return
    }

    try {
      setSaving(true)

      const res = await fetch(`/api/projetos/${selectedSlug}/partner`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerName,
          siteName,
          domain,
          buckpayStoreId: buckpayStoreId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao salvar parceiro.')
      }

      setSuccessMessage('Informações do parceiro salvas com sucesso.')

      const updated = await res.json()

      setProjects((prev) =>
        prev.map((p) =>
          p.siteSlug === selectedSlug
            ? {
                ...p,
                partnerName: updated.partnerName,
                siteName: updated.siteName,
                domain: updated.domain,
                buckpayStoreId: updated.buckpayStoreId,
              }
            : p,
        ),
      )
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Erro ao salvar parceiro.')
    } finally {
      setSaving(false)
    }
  }

  // ===== ESTADOS DE CARREGAMENTO / NÃO LOGADO =====
  if (loadingUser) {
    return (
      <main className="flex min-h-screen bg-[#050505] text-white">
        <aside className="w-64 border-r border-[#161616] bg-[#080808]" />
        <section className="flex-1 flex justify-center px-8 py-8">
          <div className="w-full max-w-5xl">
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
            Faça login novamente para acessar os parceiros e sites.
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
        <div className="w-full max-w-5xl flex flex-col gap-7">
          {/* HEADER PREMIUM */}
          <header className="relative overflow-hidden rounded-3xl border border-[#202020] bg-gradient-to-br from-[#0b0b0b] via-[#080808] to-[#050505] px-6 py-5 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/projetos')}
                  className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#202020] bg-black/40 text-white/70 hover:bg-[#111] hover:text-white transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-white">
                    Cadastrar / editar parceiro
                  </h1>
                  <p className="mt-1 max-w-md text-[12px] text-white/60">
                    Selecione um site já cadastrado e preencha os dados do
                    parceiro e do domínio que está no ar.
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Essas informações alimentam a tela de{' '}
                    <span className="font-semibold">Parceiros &amp; sites</span>{' '}
                    e o resumo financeiro.
                  </p>
                </div>
              </div>

              <div className="mt-2 md:mt-0 text-[11px] text-white/45">
                <p className="text-right">
                  Se não aparecer nenhum site na lista, cadastre primeiro em{' '}
                  <span className="font-semibold">Parceiros &amp; sites</span>.
                </p>
              </div>
            </div>
          </header>

          {/* FORM CARD */}
          <section className="relative rounded-3xl border border-[#1b1b1b] bg-gradient-to-br from-[#090909] via-[#050505] to-[#020202] px-5 py-6 md:px-7 md:py-7 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-40 w-40 rounded-full bg-emerald-500/7 blur-3xl" />

            <div className="relative">
              {loadingProjects ? (
                <div className="h-32 rounded-2xl border border-[#202020] bg-[#080808]" />
              ) : projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#262626] bg-[#080808] px-5 py-6 text-xs text-white/60">
                  Nenhum site encontrado.
                  <br />
                  <span className="text-white/45">
                    Vá até <span className="font-semibold">Parceiros &amp; sites</span>{' '}
                    e cadastre o primeiro projeto para ele aparecer aqui.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selecionar o site */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-white/70">
                      Site que você quer configurar
                    </label>
                    <p className="text-[11px] text-white/40 mb-1">
                      Escolha o site que você já cadastrou na tela de{' '}
                      <span className="font-semibold">Parceiros &amp; sites</span>.
                    </p>
                    <div className="relative">
                      <select
                        value={selectedSlug}
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full rounded-2xl border border-[#202020] bg-[#050505] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Selecione um site…</option>
                        {projects.map((p) => (
                          <option key={p.siteSlug} value={p.siteSlug}>
                            {p.siteSlug} — {p.siteName || 'sem nome definido'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Linha 1: nome do site + parceiro */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                        <Globe2 className="h-3 w-3 text-white/40" />
                        Nome do site
                      </label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="Ex: Loja White"
                        className="w-full rounded-2xl border border-[#202020] bg-[#050505] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                        <User2 className="h-3 w-3 text-white/40" />
                        Nome do parceiro
                      </label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Nome do dono / parceiro do site"
                        className="w-full rounded-2xl border border-[#202020] bg-[#050505] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Linha 2: domínio + ID loja */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                        <Link2 className="h-3 w-3 text-white/40" />
                        Domínio do site
                      </label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Ex: white-store.com.br"
                        className="w-full rounded-2xl border border-[#202020] bg-[#050505] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-white/40">
                        Só o domínio. Se não tiver ainda, pode deixar em branco.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                        <Store className="h-3 w-3 text-white/40" />
                        ID da loja (opcional)
                      </label>
                      <input
                        type="text"
                        value={buckpayStoreId}
                        onChange={(e) => setBuckpayStoreId(e.target.value)}
                        placeholder="Só se você quiser controlar qual loja está ligada a esse site"
                        className="w-full rounded-2xl border border-[#202020] bg-[#050505] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-white/40">
                        Campo só pra organização interna. Se não fizer diferença
                        pra você, pode ignorar.
                      </p>
                    </div>
                  </div>

                  {/* MENSAGENS */}
                  {(errorMessage || successMessage) && (
                    <div className="space-y-1">
                      {errorMessage && (
                        <p className="text-[11px] text-red-400">
                          {errorMessage}
                        </p>
                      )}
                      {successMessage && (
                        <p className="text-[11px] text-emerald-400">
                          {successMessage}
                        </p>
                      )}
                    </div>
                  )}

                  {/* BOTÕES */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => router.push('/projetos')}
                      className="inline-flex items-center gap-2 rounded-full border border-[#252525] bg-transparent px-4 py-2 text-[11px] text-white/70 hover:bg-[#101010] hover:text-white transition"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-[11px] font-semibold text-black hover:bg-emerald-400 transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Save className="h-3 w-3" />
                      {saving ? 'Salvando…' : 'Salvar parceiro'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
