'use client'

import HeaderAfiliados from '@/components/HeaderAfiliados'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  Clock3,
  Brain,
  Shield,
  Star,
  Users,
  Timer,
  Flame,
  Gem,
  ShoppingCart,
  Tag,
  Link2,
  MessageCircle,
  Send,
  Database,
  Server,
  Activity,
  ShieldCheck,
  RefreshCw,
  Code2,
  LifeBuoy,
} from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <HeaderAfiliados />

      {/* ================== HERO ================== */}
      <section className="relative overflow-hidden min-h-[80vh] md:min-h-[100vh] flex items-center">
        {/* glow de fundo */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,118,110,0.18),_transparent_55%)]" />


  {/* CONTEÚDO */}
  <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">

    {/* badge topo */}
    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-[#071015]/70 px-4 py-1.5 text-[11px] text-white/60 backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
      Dashboard financeiro para acompanhar ganhos e comissões dos seus sites
    </div>

    {/* TÍTULO COM GLOW */}
    <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.25)]">
      Veja em um painel tudo que você está{' '}
      <span className="text-emerald-400">ganhando rodando sites</span>{' '}
      para você e para seus clientes
    </h1>

    {/* SUBTÍTULO */}
    <p className="mt-6 max-w-2xl mx-auto text-white/60 text-[15px] leading-relaxed">
      Conecte os sites e projetos que você administra, acompanhe comissões,
      faturamento e repasses em tempo real e tenha clareza de quanto cada operação
      está colocando no seu bolso — sem planilhas confusas.
    </p>

    {/* CTA – botões */}
    <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">

      <Link
        href="#planos"
        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-10 py-3 text-sm font-semibold text-black shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:bg-emerald-400 transition"
      >
        Ver meus ganhos em painel
        <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>

      <Link
        href="#como-funciona"
        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[#0b1118]/70 px-10 py-3 text-sm font-semibold text-white/80 hover:border-emerald-400/40 hover:text-white transition backdrop-blur"
      >
        Entender o dashboard na prática
      </Link>
    </div>
  </div>
</section>

      {/* ================== SEÇÃO 2 - COMO FUNCIONA ================== */}
      <section
        id="como-funciona"
        className="relative border-t border-[#10141c] bg-[#05070d]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_55%)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:flex-row md:px-6 md:py-24">
          {/* coluna esquerda - card com 3D + stats */}
          <div className="flex-1">
            <div className="relative overflow-hidden rounded-[32px] border-8 border-[#070d16] bg-[#05080f] shadow-[0_20px_70px_rgba(0,0,0,0.9)]">
              {/* imagem + badge por cima */}
              <div className="relative h-[420px] w-full overflow-hidden rounded-[26px]">
                <div className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-black/70 px-3 py-1 text-[10px] text-white/60 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span>Painel financeiro consolidado</span>
                </div>

                <Image
                  src="/3-d.avif"
                  alt="Visual 3D do painel financeiro"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>

              {/* faixa inferior */}
              <div className="flex flex-col gap-4 bg-[#05070d] px-8 py-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xl font-semibold text-emerald-400">3</p>
                  <p className="text-xs text-white/50">
                    Principais frentes de receita acompanhadas
                  </p>
                </div>
                <div>
                  <p className="text-xll font-semibold text-emerald-400">
                    Atualização automática dos dados
                  </p>
                  <p className="text-xs text-white/50">
                    Ganhos, comissões e repasses sempre organizados em um lugar só
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* coluna direita - textos e cards */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#262c36] bg-[#070d16] px-4 py-1 text-[11px] text-white/60">
              <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Como o dashboard organiza suas finanças</span>
            </div>

            <div>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                Transformando{' '}
                <span className="text-emerald-400">extratos soltos</span> em uma
                visão clara dos seus ganhos
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-[15px]">
                Você conecta os sites, projetos e fontes de receita que roda para você
                e para os outros. O painel consolida tudo, mostra quanto cada operação
                gera, separa por cliente e deixa seus números muito mais fáceis de
                entender.
              </p>
            </div>

            {/* cards de features */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-20 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400">
                      Atualização automática de ganhos
                    </h3>
                    <p className="mt-1 text-xs text-white/60 md:text-[13px]">
                      Defina a frequência de atualização e deixe o painel puxar,
                      consolidar e exibir os valores, sem precisar ficar somando
                      tudo na mão o tempo todo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272e3a] bg-[#070d16] px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-20 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Visão inteligente por site e cliente
                    </h3>
                    <p className="mt-1 text-xs text-white/60 md:text-[13px]">
                      Saiba quanto cada site, página ou operação está gerando,
                      separe ganhos próprios de ganhos de clientes e entenda rapidamente
                      o que vale mais a pena continuar rodando.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272e3a] bg-[#070d16] px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-20 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Histórico de comissões e repasses
                    </h3>
                    <p className="mt-1 text-xs text-white/60 md:text-[13px]">
                      Acompanhe o que já caiu, o que está previsto, o que é comissão,
                      o que é repasse fixo e nunca mais se perca nas contas na hora de
                      cobrar um cliente ou planejar o mês.
                    </p>
                  </div>
                </div>
              </div>
            </div>
         </div>

        </div>
      </section>

      {/* ================== SEÇÃO 3 - SOBRE / MÉTRICAS ================== */}
      <section
        id="sobre"
        className="relative border-t border-[#10141c] bg-[#05070d] pb-24 pt-20 md:pt-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,12,20,0.95),_transparent_60%)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 md:flex-row md:px-6">
          {/* texto esquerdo */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-[11px] text-emerald-300">
              <Flame className="h-3.5 w-3.5" />
              <span>Feito para quem vive de resultados online</span>
            </div>

            <h2 className="mt-6 text-3xl font-semibold md:text-4xl">
              Sobre o painel financeiro de ganhos
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Organização, automação e clareza para o dinheiro dos seus sites.
            </p>

            <p className="mt-6 text-sm leading-relaxed text-white/60 md:text-[15px]">
              Em vez de abrir mil abas, extratos e planilhas, você acompanha tudo
              em um lugar só: quanto cada site faturou, quanto virou comissão,
              quanto é repasse para cliente e quanto realmente ficou pra você.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-[15px]">
              O painel foi pensado para quem roda sites para outras pessoas, gerencia
              projetos e quer enxergar o financeiro de forma simples, visual e direta,
              sem precisar ser “financeiro” para entender.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#planos"
                className="inline-flex items-center rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(16,185,129,0.55)] transition hover:bg-emerald-400"
              >
                Ver planos do painel
                <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/20">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
              <span className="text-xs text-white/45">
                Você foca em rodar os sites, o painel organiza os números pra você.
              </span>
            </div>
          </div>

          {/* cards direita */}
          <div className="flex-1 grid gap-6 md:grid-cols-2">
            {[
              { label: 'Sites e projetos monitorados', value: '120+' },
              { label: 'Receita acompanhada por mês', value: 'R$ 15k+' },
              { label: 'Comissões registradas', value: '800+' },
              { label: 'Fontes de receita conectadas', value: '3' },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="relative overflow-hidden rounded-[26px] border border-[#1f2632] bg-[#070d16] shadow-[0_18px_40px_rgba(0,0,0,0.75)]"
              >
                <div className="relative flex h-full flex-col justify-between px-8 py-7">
                  <div className="relative mb-8 w-fit">
                    <div className="absolute inset-0 -rotate-12 scale-110 rounded-2xl bg-[#0d111a] opacity-60" />
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#151b26] text-emerald-400 shadow-[0_8px_25px_rgba(0,0,0,0.55)]">
                      {idx === 0 && <Users className="h-6 w-6" />}
                      {idx === 1 && <Flame className="h-6 w-6" />}
                      {idx === 2 && <Tag className="h-6 w-6" />}
                      {idx === 3 && <Timer className="h-6 w-6" />}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-white/60">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================== SEÇÃO 5 - FAQ / ARQUITETURA ================== */}
      <section
        id="contato"
        className="border-t border-[#10141c] bg-[#05070d] pb-24 pt-16 md:pt-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 md:flex-row md:px-6">
          {/* FAQ */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">Dúvidas frequentes</h3>
            <div className="mt-6 space-y-4 text-sm text-white/70">
              <details className="group rounded-2xl border border-[#262c36] bg-[#070d16] px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white">
                  <span>Preciso entender de finanças para usar o painel?</span>
                  <ArrowUpRight className="h-4 w-4 rotate-45 text-white/40 group-open:-rotate-45" />
                </summary>
                <p className="mt-3 text-xs text-white/60">
                  Não. A ideia é justamente traduzir os números em algo simples:
                  você cadastra sites, clientes e valores, e o painel mostra o
                  que entrou, o que está previsto e o que já foi repassado.
                </p>
              </details>

              <details className="group rounded-2xl border border-[#262c36] bg-[#070d16] px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white">
                  <span>Em quanto tempo começo a ver meus ganhos organizados?</span>
                  <ArrowUpRight className="h-4 w-4 rotate-45 text-white/40 group-open:-rotate-45" />
                </summary>
                <p className="mt-3 text-xs text-white/60">
                  Assim que você cadastrar os projetos e dados básicos, o painel já
                  começa a mostrar uma visão geral. A partir daí, é só alimentar
                  e acompanhar a evolução.
                </p>
              </details>

              <details className="group rounded-2xl border border-[#262c36] bg-[#070d16] px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white">
                  <span>Consigo separar o que é meu e o que é de cliente?</span>
                  <ArrowUpRight className="h-4 w-4 rotate-45 text-white/40 group-open:-rotate-45" />
                </summary>
                <p className="mt-3 text-xs text-white/60">
                  Sim. Você pode marcar se o projeto é seu ou de cliente, separar
                  comissões de repasses e saber exatamente quanto de cada operação
                  fica na sua mão.
                </p>
              </details>

              <details className="group rounded-2xl border border-[#262c36] bg-[#070d16] px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white">
                  <span>Funciona com qualquer tipo de site ou nicho?</span>
                  <ArrowUpRight className="h-4 w-4 rotate-45 text-white/40 group-open:-rotate-45" />
                </summary>
                <p className="mt-3 text-xs text-white/60">
                  A lógica foi pensada para ser flexível: seja catálogo, e-commerce,
                  landing page, infoproduto ou operação mista, você consegue cadastrar
                  e acompanhar os números do mesmo jeito.
                </p>
              </details>
            </div>
          </div>

          {/* Arquitetura / como funciona por dentro */}
          <div className="flex-1">
            <div className="rounded-3xl border border-[#252c38] bg-[#070d16] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.75)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white/60">
                <Server className="h-3.5 w-3.5 text-emerald-300" />
                <span>Arquitetura do painel financeiro</span>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-white">
                Como o sistema organiza tudo nos bastidores
              </h3>
              <p className="mt-2 text-sm text-white/60">
                O foco é simples: conectar seus projetos, registrar entradas e
                repasses e transformar isso em uma visão clara do seu dinheiro.
              </p>

              {/* timeline / etapas */}
              <div className="mt-6 space-y-5 text-xs text-white/70">
                {/* etapa 1 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#05070d] border border-emerald-500/40">
                    <Database className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-white">
                      1. Cadastro de sites, projetos e valores
                    </p>
                    <p className="text-white/60">
                      Você registra os sites que roda, acordos com clientes, percentuais
                      de comissão e principais valores. O sistema guarda tudo de forma
                      organizada.
                    </p>
                  </div>
                </div>

                {/* etapa 2 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#05070d] border border-emerald-500/40">
                    <Code2 className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-white">
                      2. Consolidação das informações
                    </p>
                    <p className="text-white/60">
                      Entradas, comissões e repasses são agrupados por site, cliente
                      e período, permitindo que você enxergue o todo sem perder o
                      detalhe de cada operação.
                    </p>
                  </div>
                </div>

                {/* etapa 3 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#05070d] border border-emerald-500/40">
                    <Send className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-white">
                      3. Painel e relatórios visuais
                    </p>
                    <p className="text-white/60">
                      O sistema monta gráficos, resumos e listagens para você saber,
                      em segundos, quanto já entrou, quanto é seu e quanto é de cada
                      cliente ou projeto.
                    </p>
                  </div>
                </div>

                {/* etapa 4 */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#05070d] border border-emerald-500/40">
                    <Activity className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-white">
                      4. Acompanhamento e ajustes
                    </p>
                    <p className="text-white/60">
                      Conforme você atualiza os dados, o painel mostra a evolução mês
                      a mês e te ajuda a decidir quais projetos merecem mais foco ou
                      renegociação.
                    </p>
                  </div>
                </div>
              </div>

              {/* rodapé: estabilidade / suporte */}
              <div className="mt-6 grid gap-3 text-[11px] text-white/60 md:grid-cols-2">
                <div className="flex items-start gap-2 rounded-2xl border border-[#252c38] bg-[#05070d] px-3 py-3">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-white">
                      Estabilidade e segurança
                    </p>
                    <p>
                      Pensado para manter seus dados financeiros organizados, com
                      histórico e sem risco de perder informação importante.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-2xl border border-[#252c38] bg-[#05070d] px-3 py-3">
                  <RefreshCw className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-white">
                      Evolução contínua
                    </p>
                    <p>
                      Estrutura pronta para receber novas formas de visualizar ganhos,
                      relatórios extras e integrações conforme sua operação cresce.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
                <LifeBuoy className="h-3.5 w-3.5 text-emerald-300" />
                Depois você pode ligar esse painel com uma área de suporte ou
                documentação financeira da sua operação, se quiser.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
