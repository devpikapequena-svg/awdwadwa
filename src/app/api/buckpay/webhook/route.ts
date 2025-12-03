import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'

/**
 * Webhook da Buckpay -> painel central
 * Buckpay envia eventos como:
 *  - transaction.created (pendente)
 *  - transaction.processed (paga)
 */
export async function POST(req: NextRequest) {
  // --- 1) Descobre qual site é pelo query (?site=mlk1, ?site=mlk2, etc)
  const url = new URL(req.url)
  let siteSlug =
    url.searchParams.get('site') ||
    url.searchParams.get('siteSlug') ||
    'unknown'

  // --- 2) Segurança opcional via header
  const secretEnv = process.env.BUCKPAY_WEBHOOK_SECRET
  const incomingSecret = req.headers.get('x-webhook-secret')

  if (secretEnv && (!incomingSecret || incomingSecret !== secretEnv)) {
    console.warn('[Buckpay Webhook] Segredo inválido.')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // --- 3) Lê o body enviado pela Buckpay
  let body: any
  try {
    body = await req.json()
  } catch (err) {
    console.error('[Buckpay Webhook] Body inválido:', err)
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const event: string | undefined = body.event
  const data: any = body.data

  if (!event || !data) {
    console.error('[Buckpay Webhook] event ou data ausente:', body)
    return NextResponse.json(
      { error: 'event ou data ausente.' },
      { status: 400 },
    )
  }

  // ========================================================================
  // LOG BONITÃO DO QUE A BUCKPAY MANDOU
  // ========================================================================
  try {
    console.log('═════════════════════════════════════════════')
    console.log('🔥 BUCKPAY WEBHOOK RECEBIDO')
    console.log('═════════════════════════════════════════════')

    console.log('🔹 EVENTO:', event)
    console.log('🔹 SITE:', siteSlug)
    console.log('🔹 STATUS:', data?.status)
    console.log('🔹 MÉTODO:', data?.payment_method)

    console.log('\n👤 CLIENTE')
    console.log('   Nome:', data?.buyer?.name)
    console.log('   Email:', data?.buyer?.email)
    console.log('   Telefone:', data?.buyer?.phone)
    console.log('   Documento:', data?.buyer?.document)

    console.log('\n💰 VALORES')
    console.log('   Total (centavos):', data?.total_amount)
    if (typeof data?.total_amount === 'number') {
      console.log(
        '   Total (reais): R$',
        (data.total_amount / 100).toFixed(2),
      )
    }
    console.log('   Líquido (centavos):', data?.net_amount)

    console.log('\n📦 OFERTA')
    console.log('   Nome:', data?.offer?.name)
    console.log('   Preço (discount_price):', data?.offer?.discount_price)
    console.log('   Quantidade:', data?.offer?.quantity)

    console.log('\n📌 UTM / TRACKING')
    console.log('   ref:', data?.tracking?.ref)
    console.log('   src:', data?.tracking?.src)
    console.log('   utm.source:', data?.tracking?.utm?.source)
    console.log('   utm.medium:', data?.tracking?.utm?.medium)
    console.log('   utm.campaign:', data?.tracking?.utm?.campaign)
    console.log('   utm.id:', data?.tracking?.utm?.id)
    console.log('   utm.content:', data?.tracking?.utm?.content)
    console.log('   utm.term:', data?.tracking?.utm?.term)

    console.log('\n🕒 Criado em:', data?.created_at)

    console.log('\n🔍 RAW COMPLETO:')
    console.dir(body, { depth: null, colors: true })

    console.log('═════════════════════════════════════════════')
  } catch (logErr) {
    console.error('[Buckpay Webhook] Erro ao logar payload:', logErr)
  }
  // ========================================================================

  // Exemplo vindo da doc:
  // data.id, data.status, data.total_amount, data.net_amount, data.offer, data.buyer, data.tracking...
  const buckpayId: string | undefined = data.id
  const buckpayStatus: string | undefined = data.status
  const paymentMethod: string | undefined = data.payment_method

  if (!buckpayId || !buckpayStatus) {
    console.error('[Buckpay Webhook] id/status ausente:', {
      buckpayId,
      buckpayStatus,
    })
    return NextResponse.json(
      { error: 'id ou status ausente.' },
      { status: 400 },
    )
  }

  const totalAmountInCents: number =
    typeof data.total_amount === 'number' ? data.total_amount : 0
  const netAmountInCents: number =
    typeof data.net_amount === 'number' ? data.net_amount : 0

  const offer = data.offer || {}
  const buyer = data.buyer || {}
  const tracking = data.tracking || {}
  const utm = tracking.utm || {}

  const customer = {
    name: buyer.name || '',
    email: buyer.email || '',
    phone: (buyer.phone || '').replace(/\D/g, ''),
    document: (buyer.document || '').replace(/\D/g, ''),
  }

  // Como o webhook só manda uma "offer",
  // montamos um array de itens com 1 item.
  const items = [
    {
      id: offer.id || '', // se não vier id, fica vazio
      name: offer.name || '',
      quantity: offer.quantity || 1,
      priceInCents:
        typeof offer.discount_price === 'number'
          ? offer.discount_price
          : totalAmountInCents,
    },
  ]

  // Normaliza pra status interno do painel
  const normalizedStatus = normalizeStatusFromBuckpay(event, buckpayStatus)

  try {
    await connectDB()

    // Upsert pela transação da Buckpay
    const now = new Date()

    await Order.findOneAndUpdate(
      { gateway: 'buckpay', gatewayTransactionId: buckpayId },
      {
        $set: {
          siteSlug, // <- aqui separa qual site é (mlk1, mlk2, etc)
          gateway: 'buckpay',
          gatewayTransactionId: buckpayId,
          rawGatewayStatus: buckpayStatus,
          rawGatewayEvent: event,
          status: normalizedStatus, // waiting_payment, paid, etc

          paymentMethod: paymentMethod || 'pix',
          totalAmountInCents,
          netAmountInCents,

          offerName: offer.name || null,

          customer,
          utm: {
            ref: tracking.ref || null,
            src: tracking.src || null,
            sck: tracking.sck || null,
            utm_source: utm.source || null,
            utm_medium: utm.medium || null,
            utm_campaign: utm.campaign || null,
            utm_id: utm.id || null,
            utm_term: utm.term || null,
            utm_content: utm.content || null,
          },
          items,

          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: data.created_at ? new Date(data.created_at) : now,
        },
      },
      { upsert: true, new: true },
    )

    console.log(
      '[Buckpay Webhook] Ordem sincronizada:',
      buckpayId,
      'status:',
      normalizedStatus,
      'site:',
      siteSlug,
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Buckpay Webhook] Erro ao salvar no banco:', err)
    return NextResponse.json(
      { error: 'Erro interno ao salvar ordem.' },
      { status: 500 },
    )
  }
}

function normalizeStatusFromBuckpay(
  event?: string,
  status?: string,
): string {
  const e = (event || '').toLowerCase()
  const s = (status || '').toLowerCase()

  // transaction.processed + status paid = pago
  if (e === 'transaction.processed' || s === 'paid') return 'paid'

  // transaction.created + status pending = aguardando
  if (e === 'transaction.created' || s === 'pending')
    return 'waiting_payment'

  // você pode adicionar outros se a Buckpay tiver mais eventos/status
  return s || 'unknown'
}
