// app/api/buckpay-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import Order from '@/models/Order'
import {
  sendPushForStatus,
  NotificationStatusKey,
} from '@/lib/push'

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const siteSlug =
    url.searchParams.get('site') ||
    url.searchParams.get('siteSlug') ||
    'unknown'

  const secretEnv = process.env.BUCKPAY_WEBHOOK_SECRET
  const incomingSecret = req.headers.get('x-webhook-secret')

  if (secretEnv && (!incomingSecret || incomingSecret !== secretEnv)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const event: string | undefined = body.event
  const data: any = body.data

  if (!event || !data) {
    return NextResponse.json(
      { error: 'event ou data ausente.' },
      { status: 400 },
    )
  }

  const buckpayId: string | undefined = data.id
  const buckpayStatus: string | undefined = data.status
  const paymentMethod: string | undefined = data.payment_method

  if (!buckpayId || !buckpayStatus) {
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

  const items = [
    {
      id: offer.id || '',
      name: offer.name || '',
      quantity: offer.quantity || 1,
      priceInCents:
        typeof offer.discount_price === 'number'
          ? offer.discount_price
          : totalAmountInCents,
    },
  ]

  const normalizedStatus = normalizeStatusFromBuckpay(event, buckpayStatus)
  const notificationStatusKey = mapOrderStatusToNotificationStatus(
    normalizedStatus,
  )

  try {
    await connectDB()

    const now = new Date()

    await Order.findOneAndUpdate(
      { gateway: 'buckpay', gatewayTransactionId: buckpayId },
      {
        $set: {
          siteSlug,
          gateway: 'buckpay',
          gatewayTransactionId: buckpayId,
          rawGatewayStatus: buckpayStatus,
          rawGatewayEvent: event,
          status: normalizedStatus,

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

    // 🔔 SE TIVER STATUS MAPEADO, DISPARA PUSH
    if (notificationStatusKey) {
      const valorReais = (totalAmountInCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })

      const tituloPorStatus: Record<NotificationStatusKey, string> = {
        paid: '💸 Nova venda aprovada',
        pending: '⏳ Venda pendente',
        med: '↩️ Venda estornada / ajustada',
      }

      const title = tituloPorStatus[notificationStatusKey] || 'Atualização de venda'

      const body = `${offer.name || 'Pedido'} - ${valorReais} • Status: ${normalizedStatus.toUpperCase()}`

      await sendPushForStatus(notificationStatusKey, {
        title,
        body,
        url: '/mobile/comissoes',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Buckpay Webhook] Erro ao salvar/mandar push:', err)
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
  const e = (event || '').trim().toLowerCase()
  const s = (status || '').trim().toLowerCase()

  // Casos explícitos da Buckpay
  if (e === 'transaction.processed' || s === 'paid') return 'paid'
  if (e === 'transaction.created' || s === 'pending') return 'waiting_payment'

  // 🧠 Heurística de segurança:
  // qualquer status que "pareça" pago
  if (
    s.includes('paid') ||
    s.includes('approved') ||
    s.includes('success') ||
    s.includes('processed')
  ) {
    return 'paid'
  }

  // qualquer coisa que pareça pendente
  if (s.includes('wait') || s.includes('pend')) {
    return 'waiting_payment'
  }

  // qualquer coisa que pareça estorno/cancelamento
  if (
    s.includes('refun') || // refund, refunded
    s.includes('charge') || // chargeback
    s.includes('cancel') // cancel, canceled, cancelled
  ) {
    return 'refunded'
  }

  return s || 'unknown'
}

// Mapeia status interno do pedido -> opção marcada na tela (paid/pending/med)
function mapOrderStatusToNotificationStatus(
  orderStatus: string,
): NotificationStatusKey | null {
  const s = (orderStatus || '').trim().toLowerCase()

  // casos diretos
  if (s === 'paid') return 'paid'
  if (s === 'waiting_payment' || s === 'pending') return 'pending'
  if (['refunded', 'chargeback', 'canceled', 'cancelled'].includes(s)) {
    return 'med'
  }

  // 🧠 fallback por substring
  if (
    s.includes('paid') ||
    s.includes('approved') ||
    s.includes('success') ||
    s.includes('processed')
  ) {
    return 'paid'
  }

  if (s.includes('wait') || s.includes('pend')) {
    return 'pending'
  }

  if (
    s.includes('refun') ||
    s.includes('charge') ||
    s.includes('cancel')
  ) {
    return 'med'
  }

  return null
}
