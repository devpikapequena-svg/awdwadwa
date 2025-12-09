'use client'
import Footer from "@/components/Footer"
import HeaderAfiliados from '@/components/HeaderAfiliados'
import Image from 'next/image'
import {
  Bell,
  ShieldCheck,
  RefreshCw,
  Activity,
  BarChart3,
} from 'lucide-react'

export default function DashboardLanding() {
  return (
    <div className="relative min-h-screen bg-[#070707] text-white overflow-hidden">
      {/* HEADER POR CIMA DE TUDO */}
      <div className="relative z-20">
        <HeaderAfiliados />
      </div>

      {/* ============= GLOW BRANCO MAIS FRACO ============= */}
      <div className="pointer-events-none absolute inset-x-0 top-[0px] z-0">
        <div
          className="
            h-[280px]
            bg-[radial-gradient(circle_at_top,_rgba(158,158,158,0.25),_rgba(158,158,158,0.10)_5%,_transparent_90%)]
            blur-[108px]
          "
        />
      </div>

      {/* ========== CONTEÚDO ========== */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-32 md:px-6 md:pt-40">
        {/* ================= HERO ================= */}
        <section className="text-center">
          {/* badge */}
          <div className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60">
            Bring your finances to the next scale
          </div>

          {/* título */}
          <h1 className="mt-6 text-[32px] leading-tight font-semibold md:text-[40px]">
            Revolucione suas finanças com{' '}
            <span className="block text-white/80">nossas soluções de ponta</span>
          </h1>

          {/* subtítulo */}
          <p className="mt-4 text-sm text-white/55 max-w-xl mx-auto">
            Centralize vendas, recebíveis, comissões e gastos em anúncios em um único
            dashboard conectado diretamente aos seus gateways de pagamento.
          </p>

          {/* botões */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              className="inline-flex h-10 items-center justify-center rounded-full bg-white 
              text-[13px] font-medium text-black px-5 shadow-[0_18px_45px_rgba(0,0,0,0.65)]
              hover:bg-[#f5f5f5] transition"
            >
              Get started
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/30 
              bg-white/5 text-[13px] font-medium text-white/90 px-5 hover:bg-white/10 transition"
            >
              Try a free demo
            </button>
          </div>
        </section>

        {/* ================= IMAGEM DO DASHBOARD ================= */}
        <section className="mt-20">
          <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/80 shadow-[0_40px_120px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src="painel.png"
                alt="Prévia do dashboard financeiro"
                fill
                priority
              />
            </div>
          </div>
        </section>

        {/* ================= FEATURES (ROBUST FEATURES) ================= */}
        <section id="features" className="mt-32 scroll-mt-[120px]">
          {/* topo da seção */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
              Robust features
            </div>

            <h2 className="mt-5 text-[28px] md:text-[32px] font-semibold leading-tight">
              Recursos poderosos
              <span className="block text-white/80">para enxergar cada venda em detalhe.</span>
            </h2>

            <p className="mt-4 text-sm text-white/55">
              Acompanhe vendas aprovadas e pendentes, comissões, gastos em mídia e recebimentos
              em tempo real, sem abrir planilhas ou painéis separados.
            </p>
          </div>

          {/* GRID 2x2 */}
          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {/* CARD 1 */}
            <div className="flex flex-col">
              <div className="overflow-hidden">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/notify.png"
                    alt="Alertas inteligentes de recebíveis"
                    fill
                    className="object-contain"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(7,7,7,0.98)_100%)]" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Bell className="h-4 w-4 text-white/60" strokeWidth={1.6} />
                  <span>Notificações inteligentes de vendas</span>
                </h3>
                <p className="mt-2 text-xs text-white/55 max-w-md">
                  Receba alertas a cada nova venda aprovada ou marcada como pendente,
                  com valor, origem e gateway — no painel, por e-mail ou push no app mobile.
                </p>
              </div>

              <div className="mt-6 h-px w-full border-t border-dashed border-white/10" />
            </div>

            {/* CARD 2 */}
            <div className="flex flex-col">
              <div className="overflow-hidden">
                <div className="relative aspect-[16/9] w-full pt-6">
                  <Image
                    src="/security.png"
                    alt="Segurança nível banco"
                    fill
                    className="object-cover object-[center_20%]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(7,7,7,0.98)_95%)]" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldCheck className="h-4 w-4 text-white/60" strokeWidth={1.6} />
                  <span>Segurança nível banco para seus dados</span>
                </h3>
                <p className="mt-2 text-xs text-white/55 max-w-md">
                  Acesso segmentado por usuário, histórico de ações e criptografia ponta a
                  ponta para proteger informações sensíveis de vendas e faturamento.
                </p>
              </div>

              <div className="mt-6 h-px w-full border-t border-dashed border-white/10" />
            </div>

            {/* CARD 3 */}
            <div className="flex flex-col">
              <div className="overflow-hidden">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/ia.png"
                    alt="IA para detecção de desvios"
                    fill
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(7,7,7,0.98)_95%)]" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Activity className="h-4 w-4 text-white/60" strokeWidth={1.6} />
                  <span>IA para desvios de performance</span>
                </h3>
                <p className="mt-2 text-xs text-white/55 max-w-md">
                  Acompanhe quedas de aprovação, aumento de pendências e oscilações
                  de faturamento por gateway, canal ou campanha, com alertas automáticos.
                </p>
              </div>

              <div className="mt-6 h-px w-full border-t border-dashed border-white/10" />
            </div>

            {/* CARD 4 */}
            <div className="flex flex-col">
              <div className="overflow-hidden">
                <div className="relative aspect-[16/9] w-full pt-6">
                  <Image
                    src="/dados.png"
                    alt="Dashboard de vendas e comissões"
                    fill
                    className="object-cover object-[center_00%]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(7,7,7,0.98)_95%)]" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <RefreshCw className="h-4 w-4 text-white/60" strokeWidth={1.6} />
                  <span>Dashboard de vendas, comissões e ROI</span>
                </h3>
                <p className="mt-2 text-xs text-white/55 max-w-md">
                  Registre gastos em anúncios, pagamentos recebidos e veja em um só lugar
                  receita, comissões e retorno por canal, campanha ou produto.
                </p>
              </div>

              <div className="mt-6 h-px w-full border-t border-dashed border-white/10" />
            </div>
          </div>
        </section>

        {/* ============= SEÇÃO: CONCILIAÇÃO PONTA A PONTA ============= */}
        <section id="conciliation" className="mt-32 border-t border-white/5 pt-16">
          <div className="grid gap-12 md:grid-cols-[1.1fr,1fr] items-start">
            {/* TEXTO ESQUERDA */}
            <div>
              <div className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Conciliação ponta a ponta
              </div>

              <h2 className="mt-5 text-[26px] md:text-[30px] font-semibold leading-tight">
                Da venda no gateway ao dinheiro na conta.
              </h2>

              <p className="mt-4 text-sm text-white/55 max-w-lg">
                O EQP cruza automaticamente vendas aprovadas e pendentes com
                recebimentos bancários, registrando o que já foi pago, o que está a
                receber e o que ainda não apareceu em nenhum extrato.
              </p>

              <div className="mt-8 space-y-4 text-sm text-white/65">
                <div className="flex items-start gap-3">
                  <RefreshCw className="mt-[2px] h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Linha do tempo por venda</p>
                    <p className="text-xs text-white/55">
                      Acompanhe cada venda desde a aprovação no gateway até o crédito
                      na conta, com datas, valores e taxas já organizados.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="mt-[2px] h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Divergências viram tarefas</p>
                    <p className="text-xs text-white/55">
                      Vendas aprovadas sem recebimento ou valores diferentes do esperado
                      são destacadas para investigação, em vez de se perderem no volume.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-[2px] h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Fechamento simples de entender</p>
                    <p className="text-xs text-white/55">
                      Painéis pensados para operação e diretoria, com números já
                      conciliados por dia, conta, gateway e forma de pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARDS DIREITA */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_75%)] blur-3xl" />

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Gateways & canais de venda
                  </p>
                  <p className="mt-2 text-sm text-white">
                    Consolide vendas de diferentes gateways, produtos e canais em um
                    único fluxo de conciliação.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Contas & recebimentos
                  </p>
                  <p className="mt-2 text-sm text-white">
                    Relacione automaticamente vendas com créditos em conta, Pix
                    recebidos e repasses de cada gateway.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Comissões & repasses
                  </p>
                  <p className="mt-2 text-sm text-white">
                    Controle quanto vai para a operação, parceiros ou afiliados em
                    cada venda, já alinhado com o que foi efetivamente pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============= LINHA CONCILIAÇÃO → APP MOBILE ============= */}
        <div className="mt-28 border-t border-white/5" />

        {/* ============= SEÇÃO APP MOBILE ============= */}
        <section id="mobile-app" className="mt-32 scroll-mt-[260px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] px-6 py-12 md:px-12 md:py-16">
            {/* glow de fundo puxando pro lado direito */}
            <div className="pointer-events-none absolute inset-y-0 right-[-120px] w-[360px] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_70%)] blur-3xl" />

            <div className="grid gap-10 md:grid-cols-2 items-center">
              {/* TEXTO ESQUERDA */}
              <div className="relative z-10">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#b5b5b5]">
                  App mobile EQP
                </p>

                <h2 className="mt-4 text-[28px] md:text-[32px] font-semibold leading-tight">
                  Acompanhe o caixa
                  <span className="block text-white/80">na palma da sua mão.</span>
                </h2>

                <p className="mt-4 text-sm text-white/55 max-w-md">
                  Veja vendas aprovadas, pendentes, recebíveis do dia e saldo projetado
                  direto do celular, com a mesma visão do painel web.
                </p>

                <div className="mt-6 space-y-2 text-xs text-white/60">
                  <p>• Alertas push de novas vendas e mudanças de status.</p>
                  <p>• Atalhos para ver comissões, gateways e canais que mais vendem.</p>
                  <p>• Login seguro com o mesmo nível de proteção do dashboard.</p>
                </div>
              </div>

              {/* IMAGEM DIREITA */}
              <div className="relative z-10 flex justify-center md:justify-end">
                <div className="relative w-full max-w-md md:max-w-lg">
                  <Image
                    src="/iphone.png"
                    alt="App mobile EQP Dashboard"
                    width={2000}
                    height={800}
                    className="w-full h-auto object-contain"
                  />
                  <div className="pointer-events-none absolute inset-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============= LINHA APP MOBILE → INTEGRAÇÕES ============= */}
        <div className="mt-28 border-t border-white/5" />

        {/* ===================== SEÇÃO DE INTEGRAÇÕES ===================== */}
        <section id="integrations" className="mt-32 scroll-mt-[120px]">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
              Integrações & conectividade
            </div>

            <h2 className="mt-5 text-[28px] md:text-[32px] font-semibold leading-tight">
              Conecte toda a sua operação
              <span className="block text-white/80">em um único ecossistema.</span>
            </h2>

            <p className="mt-4 text-sm text-white/55">
              Conecte seus gateways de pagamento, contas bancárias e fontes de gasto em
              anúncios para ter uma visão completa do funil financeiro da operação.
            </p>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {/* IMAGEM ILUSTRATIVA */}
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black/40 h-[330px] md:h-[390px]">
              <Image
                src="/api.jpg"
                alt="Integrações EQP"
                fill
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(7,7,7,0.98)_95%)]" />
            </div>

            {/* LISTA DE BENEFÍCIOS */}
            <div className="space-y-7 text-white">
              <div>
                <p className="text-sm font-medium">Gateways plug & play</p>
                <p className="mt-1 text-xs text-white/55">
                  Conecte rapidamente os principais gateways de pagamento e comece a ver
                  vendas em tempo real no EQP sem esforço de desenvolvimento pesado.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Contas bancárias & carteiras</p>
                <p className="mt-1 text-xs text-white/55">
                  Leia extratos, Pix recebidos e repasses para cruzar o que saiu dos
                  gateways com o que efetivamente entrou na conta.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Fontes de tráfego & anúncios</p>
                <p className="mt-1 text-xs text-white/55">
                  Registre ou integre gastos em mídia para enxergar custo por venda,
                  margem e ROI direto no dashboard financeiro.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">API pensada para produtos digitais</p>
                <p className="mt-1 text-xs text-white/55">
                  Use a API para enviar eventos de venda, comissões e gastos direto do
                  seu produto, mantendo o EQP como camada única de controle financeiro.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Webhooks & eventos em tempo real</p>
                <p className="mt-1 text-xs text-white/55">
                  Dispare atualizações de status para bots, automações internas, Slack
                  ou qualquer sistema que seu time já use no dia a dia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============= LINHA INTEGRAÇÕES → AUTOMAÇÃO ============= */}
        <div className="mt-28 border-t border-white/5" />

        {/* ===================== SEÇÃO DE AUTOMAÇÃO INTELIGENTE ===================== */}
        <section id="automation" className="mt-32 scroll-mt-[240px]">
          <div className="grid gap-14 md:grid-cols-[1fr,1.1fr] items-center">
            {/* TEXTO */}
            <div>
              <div className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Automação inteligente
              </div>

              <h2 className="mt-5 text-[28px] md:text-[32px] font-semibold leading-tight">
                Seu financeiro
                <span className="block text-white/80">trabalhando sozinho.</span>
              </h2>

              <p className="mt-4 text-sm text-white/55 max-w-md">
                Deixe o EQP rodar de fundo: ele concilia vendas, calcula comissões,
                cruza gastos em anúncios com faturamento e te entrega só o que precisa
                de decisão humana.
              </p>

              <div className="mt-8 space-y-4 text-sm text-white/65">
                <div className="flex items-start gap-3">
                  <Bell className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Alertas orientados por regras</p>
                    <p className="text-xs text-white/55">
                      Configure limites de queda de aprovação, aumento de pendências,
                      variação de receita ou de custo por venda e seja avisado na hora.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RefreshCw className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Rotinas agendadas automaticamente</p>
                    <p className="text-xs text-white/55">
                      Relatórios diários de vendas, comissões e ROI, consolidações
                      semanais e resumos mensais enviados para as pessoas certas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  <div>
                    <p className="font-medium text-white">Workflows para exceções</p>
                    <p className="text-xs text-white/55">
                      Divergências, picos de gasto ou quedas bruscas de receita podem
                      abrir tarefas, notificar squads específicos ou alimentar filas de
                      atendimento automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* IMAGEM ILUSTRATIVA */}
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black/40">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/automatiza.png"
                  alt="Automação inteligente EQP"
                  fill
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(7,7,7,0.98)_95%)]" />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================== */}
      </main>
      <Footer />
    </div>
  )
}
