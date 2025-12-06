// app/api/notifications/test/route.ts
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_CONTACT_EMAIL =
  process.env.VAPID_CONTACT_EMAIL || 'mailto:suporte@seusite.com'

let vapidReady = false

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('[PUSH] VAPID keys não configuradas. Verifique ENV.')
} else {
  try {
    webpush.setVapidDetails(
      VAPID_CONTACT_EMAIL,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    )
    vapidReady = true
    console.log('[PUSH] VAPID configurado com sucesso.')
  } catch (err) {
    console.error('[PUSH] Erro ao configurar VAPID:', err)
  }
}

export async function GET() {
  // Essa rota é só de TESTE, não pode quebrar o build nunca
  if (!vapidReady) {
    console.log('[NOTIFICATIONS TEST] VAPID não configurado, retornando status "desativado".')
    return NextResponse.json(
      {
        ok: false,
        message:
          'Notificações push não estão configuradas (VAPID ausente nas variáveis de ambiente).',
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      message: 'Notificações push configuradas corretamente.',
      publicKey: VAPID_PUBLIC_KEY,
    },
    { status: 200 },
  )
}
