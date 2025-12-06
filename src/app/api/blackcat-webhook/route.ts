import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'

/**
 * Webhook da Blackcat -> painel central
 */
export async function POST(req: NextRequest) {
  // 1) Descobre qual site é (?site=robloxw, ?site=roblowj, etc)
  const url = new URL(req.url)
  const siteSlug =
    url.searchParams.get('site') ||
    url.searchParams.get('siteSlug') ||
    'unknown'

  // 2) Segurança via header
  const secretEnv = process.env.BLACKCAT_WEBHOOK_SECRET
  const incomingSecret = req.headers.get('x-webhook-secret')

  if (secretEnv && (!incomingSecret || incomingSecret !== secretEnv)) {
    console.warn('[Blackcat Webhook] Segredo inválido.')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 3) Lê o body enviado pela Blackcat
  let body: any
  try {
    body = await req.json()
  } catch (err) {
    console.error('[Blackcat Webhook] Body inválido:', err)
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  // A Blackcat pode mandar direto o objeto da transação
  // ou vir embrulhado em { data: { ... } }
  const tx = body?.data ?? body

  if (!tx || !tx.id || !tx.status) {
    console.error('[Blackcat Webhook] tx.id ou tx.status ausente:', tx)
    return NextResponse.json(
      { error: 'tx.id ou tx.status ausente.' },
      { status: 400 },
    )
  }

  const blackcatId = String(tx.id)
  const blackcatStatus = String(tx.status || '').toLowerCase()
  const paymentMethod = tx.paymentMethod || 'pix'

  const totalAmountInCents: number =
    typeof tx.amount === 'number' ? tx.amount : 0

  const netAmountInCents: number =
    typeof tx.fee?.netAmount === 'number' ? tx.fee.netAmount : 0

  // ================== LOG BONITÃO ==================
  try {
    console.log('═════════════════════════════════════════════')
    console.log('🔥 BLACKCAT WEBHOOK RECEBIDO')
    console.log('═════════════════════════════════════════════')

    console.log('🔹 SITE:', siteSlug)
    console.log('🔹 ID:', blackcatId)
    console.log('🔹 STATUS:', blackcatStatus)
    console.log('🔹 MÉTODO:', paymentMethod)

    console.log('\n👤 CLIENTE')
    console.log('   Nome:', tx.customer?.name)
    console.log('   Email:', tx.customer?.email)
    console.log('   Telefone:', tx.customer?.phone)
    console.log('   Documento:', tx.customer?.document?.number)

    console.log('\n💰 VALORES')
    console.log('   Total (centavos):', totalAmountInCents)
    if (totalAmountInCents) {
      console.log(
        '   Total (reais): R$',
        (totalAmountInCents / 100).toFixed(2),
      )
    }
    console.log('   Líquido (centavos):', netAmountInCents)

    console.log('\n📦 ITENS')
    ;(tx.items || []).forEach((it: any, idx: number) => {
      console.log(`   #${idx + 1}:`, {
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        tangible: it.tangible,
        externalRef: it.externalRef,
      })
    })

    console.log('\n🕒 Criado em:', tx.createdAt)

    console.log('\n🔍 RAW COMPLETO:')
    console.dir(body, { depth: null, colors: true })

    console.log('═════════════════════════════════════════════')
  } catch (logErr) {
    console.error('[Blackcat Webhook] Erro ao logar payload:', logErr)
  }
  // =================================================

  const customer = {
    name: tx.customer?.name || '',
    email: tx.customer?.email || '',
    phone: (tx.customer?.phone || '').replace(/\D/g, ''),
    document: (tx.customer?.document?.number || '').replace(/\D/g, ''),
  }

  const items =
    Array.isArray(tx.items) && tx.items.length > 0
      ? tx.items.map((it: any) => ({
          id: it.externalRef || '',
          name: it.title || '',
          quantity: it.quantity || 1,
          priceInCents:
            typeof it.unitPrice === 'number' ? it.unitPrice : 0,
        }))
      : []

  const normalizedStatus = normalizeStatusFromBlackcat(blackcatStatus)

  try {
    await connectDB()

    const now = new Date()

    await Order.findOneAndUpdate(
      { gateway: 'blackcat', gatewayTransactionId: blackcatId },
      {
        $set: {
          siteSlug,
          gateway: 'blackcat',
          gatewayTransactionId: blackcatId,
          rawGatewayStatus: blackcatStatus,
          status: normalizedStatus,

          paymentMethod,
          totalAmountInCents,
          netAmountInCents,

          offerName: items[0]?.name || null,

          customer,
          // sem utms vindos da Blackcat — deixa tudo null
          utm: {
            ref: null,
            src: null,
            sck: null,
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_id: null,
            utm_term: null,
            utm_content: null,
          },
          items,

          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: tx.createdAt ? new Date(tx.createdAt) : now,
        },
      },
      { upsert: true, new: true },
    )

    console.log(
      '[Blackcat Webhook] Ordem sincronizada:',
      blackcatId,
      'status:',
      normalizedStatus,
      'site:',
      siteSlug,
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Blackcat Webhook] Erro ao salvar no banco:', err)
    return NextResponse.json(
      { error: 'Erro interno ao salvar ordem.' },
      { status: 500 },
    )
  }
}

function normalizeStatusFromBlackcat(status?: string): string {
  const s = (status || '').toLowerCase()

  if (s === 'paid') return 'paid'
  if (s === 'waiting_payment' || s === 'pending') return 'waiting_payment'
  if (s === 'refunded') return 'refunded'
  if (s === 'canceled' || s === 'cancelled') return 'canceled'

  return s || 'unknown'
}
