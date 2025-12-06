import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import NotificationSubscription from '@/models/NotificationSubscription'
import webPush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:suporte@eqp-dashboard.com'

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error(
    '[NOTIFICATIONS TEST] VAPID keys não configuradas. Verifique ENV.',
  )
}

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    const userId = String(user.id)

    const subs = await NotificationSubscription.find({ userId })

    if (!subs || subs.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Nenhuma subscription encontrada para este usuário. Ative as notificações no app primeiro.',
        },
        { status: 404 },
      )
    }

    const payload = JSON.stringify({
      title: 'Teste de notificação',
      body: 'Se você está vendo isso, o push está funcionando ✅',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: '/mobile/comissoes',
    })

    let sentCount = 0

    for (const sub of subs) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      }

      try {
        await webPush.sendNotification(subscription as any, payload)
        sentCount++
      } catch (err: any) {
        // se a subscription estiver inválida/expirada, remove do banco
        const statusCode = err?.statusCode || err?.status
        if (statusCode === 404 || statusCode === 410) {
          await NotificationSubscription.deleteOne({ _id: sub._id })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sent: sentCount,
    })
  } catch (err) {
    console.error('[POST /api/notifications/test] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao enviar notificação de teste' },
      { status: 500 },
    )
  }
}
