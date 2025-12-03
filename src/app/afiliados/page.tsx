'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Sidebar from '@/components/Sidebar'

type Plan = 'none' | 'starter' | 'pro' | 'elite'

type User = {
  id: string
  name: string
  email: string
  plan: Plan
  affiliates?: Affiliates
}

type Affiliates = {
  aliexpress: {
    appKey: string
    secret: string
    trackingId: string
  }
  amazon: {
    associateId: string
    accessKey: string
    secretKey: string
  }
  awin: {
    affiliateId: string
    apiToken: string
  }
  shopee: {
    affiliateId: string
    apiPassword: string
  }
  magalu: {
    storeName: string
  }
  natura: {
    digitalSpaceUrl: string
  }
}

const emptyAffiliates: Affiliates = {
  aliexpress: { appKey: '', secret: '', trackingId: '' },
  amazon: { associateId: '', accessKey: '', secretKey: '' },
  awin: { affiliateId: '', apiToken: '' },
  shopee: { affiliateId: '', apiPassword: '' },
  magalu: { storeName: '' },
  natura: { digitalSpaceUrl: '' },
}

export default function AffiliatesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [affiliates, setAffiliates] = useState<Affiliates>(emptyAffiliates)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          setUser(null)
          return
        }

        const data = await res.json()
        setUser(data)

        if (data.affiliates) {
          setAffiliates({
            ...emptyAffiliates,
            ...data.affiliates,
          })
        } else {
          // tentar pegar da rota específica (caso vc use as duas)
          const resAff = await fetch('/api/afiliados', {
            method: 'GET',
            credentials: 'include',
          })
          if (resAff.ok) {
            const affData = await resAff.json()
            setAffiliates({
              ...emptyAffiliates,
              ...affData.affiliates,
            })
          }
        }
      } catch (err) {
        console.error('Erro ao buscar afiliados', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (
    section: keyof Affiliates,
    field: string,
    value: string,
  ) => {
    setAffiliates((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/afiliados', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(affiliates),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'Erro ao salvar dados de afiliados.')
      } else {
        const data = await res.json()
        setAffiliates({
          ...emptyAffiliates,
          ...data.affiliates,
        })
        const now = new Date()
        setSavedAt(
          now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        )
      }
    } catch (err) {
      console.error('Erro ao salvar afiliados', err)
      setErrorMsg('Erro inesperado ao salvar dados.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen bg-[#050505] text-white">
        <aside className="w-64 border-r border-[#161616] bg-[#080808]" />
        <section className="flex-1 px-10 py-10">
          <div className="h-6 w-52 rounded-full bg-[#141414]" />
          <div className="mt-6 h-10 w-40 rounded-full bg-[#101010]" />
          <div className="mt-6 h-32 rounded-3xl border border-[#1b1b1b] bg-[#080808]" />
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
            Faça login novamente para acessar o painel de ofertas automatizadas.
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

  const isFree = user.plan === 'none'

  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={user} />

      <section className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* HEADER */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Afiliados & integrações de comissão
              </h1>
              <p className="mt-1 max-w-xl text-xs text-white/55">
                Conecte suas contas de afiliado. O bot usa essas credenciais
                para montar links corretos, testar cupons e registrar vendas
                para você.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 text-[11px] md:items-end">
              <span className="rounded-full border border-[#202020] bg-[#101010] px-3 py-1 text-white/70">
                Plano: <span className="font-semibold">{user.plan}</span>
              </span>
              {savedAt && (
                <span className="text-white/45">
                  Último salvamento: {savedAt}
                </span>
              )}
            </div>
          </header>

          {/* CONTAINER PRINCIPAL */}
          <div className="relative rounded-3xl border border-[#1b1b1b] bg-[#050505] px-5 py-6 md:px-7 md:py-7">
            <div
              className={
                isFree
                  ? 'pointer-events-none select-none opacity-25'
                  : ''
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* AliExpress */}
                <AffiliateCard
                  title="Afiliados AliExpress"
                  description="Use os dados da sua conta oficial de afiliados AliExpress para gerar links e acompanhar vendas."
                  logoSrc="/aliexpress.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="AliExpress App Key"
                        value={affiliates.aliexpress.appKey}
                        onChange={(v) =>
                          handleChange('aliexpress', 'appKey', v)
                        }
                      />
                      <Field
                        label="AliExpress Secret"
                        value={affiliates.aliexpress.secret}
                        onChange={(v) =>
                          handleChange('aliexpress', 'secret', v)
                        }
                      />
                      <Field
                        label="AliExpress Tracking Id"
                        value={affiliates.aliexpress.trackingId}
                        onChange={(v) =>
                          handleChange('aliexpress', 'trackingId', v)
                        }
                      />
                    </div>
                  }
                />

                {/* Amazon */}
                <AffiliateCard
                  title="Afiliados Amazon"
                  description="A API de afiliados da Amazon é obrigatória para o bot conseguir gerar links e consultar produtos."
                  highlight="ATENÇÃO! API da Amazon é OBRIGATÓRIA."
                  logoSrc="/amazon.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="Amazon Afiliado Id"
                        value={affiliates.amazon.associateId}
                        onChange={(v) =>
                          handleChange('amazon', 'associateId', v)
                        }
                      />
                      <Field
                        label="Amazon Access Key"
                        value={affiliates.amazon.accessKey}
                        onChange={(v) =>
                          handleChange('amazon', 'accessKey', v)
                        }
                      />
                      <Field
                        label="Amazon Secret Key"
                        value={affiliates.amazon.secretKey}
                        onChange={(v) =>
                          handleChange('amazon', 'secretKey', v)
                        }
                      />
                    </div>
                  }
                />

                {/* AWIN */}
                <AffiliateCard
                  title="Afiliados AWIN"
                  description="Use sua conta AWIN para rastrear comissões em lojas parceiras."
                  logoSrc="/awin.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="Awin Afiliado Id"
                        value={affiliates.awin.affiliateId}
                        onChange={(v) =>
                          handleChange('awin', 'affiliateId', v)
                        }
                      />
                      <Field
                        label="Awin API Token"
                        value={affiliates.awin.apiToken}
                        onChange={(v) =>
                          handleChange('awin', 'apiToken', v)
                        }
                      />
                    </div>
                  }
                />

                {/* Shopee */}
                <AffiliateCard
                  title="Afiliados Shopee"
                  description="Integração com Shopee Afiliados para links, cupons e conversão de vendas."
                  extraNote="Se não tiver API, deixe em branco. O bot usa o link curto no formato https://shoope.top/_123456789."
                  logoSrc="/shopee.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="Shopee ID Afiliado"
                        value={affiliates.shopee.affiliateId}
                        onChange={(v) =>
                          handleChange('shopee', 'affiliateId', v)
                        }
                      />
                      <Field
                        label="Senha API"
                        value={affiliates.shopee.apiPassword}
                        onChange={(v) =>
                          handleChange('shopee', 'apiPassword', v)
                        }
                      />
                    </div>
                  }
                />

                {/* Magalu */}
                <AffiliateCard
                  title="Afiliados Magalu"
                  description="Configure o nome da sua loja Magalu para o bot montar os links corretamente."
                  logoSrc="/magalu.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="Magalu Nome da Loja"
                        value={affiliates.magalu.storeName}
                        onChange={(v) =>
                          handleChange('magalu', 'storeName', v)
                        }
                      />
                    </div>
                  }
                />

                {/* Mercado Livre (informativo, sem campo) */}
                <AffiliateCard
                  title="Afiliados Mercado Livre"
                  description="A partir de 21/06/2025, o bot não converte mais links automaticamente."
                  highlight="🚨 ATENÇÃO! 🚨"
                  extraNote="Sempre utilize seu link de afiliado já convertido ao cadastrar um produto Mercado Livre. Não é necessário cadastrar nenhum ID de afiliado aqui."
                  logoSrc="/mercadolivre.png"
                  body={
                    <div className="rounded-xl border border-dashed border-[#262626] bg-[#050505] px-3 py-3 text-[10px] text-white/55">
                      Para adicionar um produto Mercado Livre, informe o
                      <span className="font-semibold"> link já convertido</span>{' '}
                      na aba <span className="font-semibold">Links & produtos</span>.
                    </div>
                  }
                />

                {/* Natura */}
                <AffiliateCard
                  title="Afiliados Natura"
                  description="Informe o link do seu Espaço Digital Natura. O bot sempre usará esse link ao divulgar produtos Natura."
                  logoSrc="/natura.png"
                  body={
                    <div className="space-y-3 text-[11px]">
                      <Field
                        label="Link do seu Espaço Digital Natura"
                        placeholder="https://www.natura.com.br/consultoria/seu-espaco"
                        value={affiliates.natura.digitalSpaceUrl}
                        onChange={(v) =>
                          handleChange('natura', 'digitalSpaceUrl', v)
                        }
                      />
                    </div>
                  }
                />
              </div>

              {/* Rodapé com salvar */}
              <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-[#202020] pt-4 text-[11px] md:flex-row md:items-center">
                <div className="text-white/50">
                  Esses dados são salvos apenas na sua conta. O bot usa essas
                  integrações para montar links de afiliado corretos em{' '}
                  <span className="font-semibold text-white/75">
                    Links & produtos
                  </span>{' '}
                  e nas{' '}
                  <span className="font-semibold text-white/75">
                    Filas de disparo
                  </span>
                  .
                </div>

                <div className="flex items-center gap-2">
                  {errorMsg && (
                    <span className="text-[10px] text-red-400">
                      {errorMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? 'Salvando…' : 'Salvar integrações'}
                  </button>
                </div>
              </div>
            </div>

            {/* Se quiser bloquear quando plano = none, pode reaproveitar overlay do dashboard */}
          </div>
        </div>
      </section>
    </main>
  )
}

/* COMPONENTES MENORES */

function AffiliateCard({
  title,
  description,
  highlight,
  extraNote,
  logoSrc,
  body,
}: {
  title: string
  description: string
  highlight?: string
  extraNote?: string
  logoSrc: string
  body: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#202020] bg-[#080808] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          {highlight && (
            <p className="text-[11px] font-semibold text-amber-300">
              {highlight}
            </p>
          )}
          <p className="text-[11px] text-white/60">{description}</p>
          {extraNote && (
            <p className="mt-1 text-[10px] text-white/45">{extraNote}</p>
          )}
        </div>

        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#050505]">
          <Image
            src={logoSrc}
            alt={title}
            fill
            sizes="48px"
            className="object-contain p-1.5"
          />
        </div>
      </div>

      {body}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-white/70">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#262626] bg-[#050505] px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-[#3a3a3a]"
      />
    </div>
  )
}
