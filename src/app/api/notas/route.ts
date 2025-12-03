// app/api/relatorios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PartnerProject from '@/models/PartnerProject'
import PartnerPayment from '@/models/PartnerPayment'
import Order, { OrderDocument } from '@/models/Order'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')

    // 🔹 parceiros (config de site + nome do parceiro)
    const partners = await PartnerProject.find().lean()

    // 🔹 pedidos pago via BuckPay
    const orders = await Order.find({
      gateway: 'buckpay',
      status: 'paid',
    }).lean<OrderDocument[]>()

    // 🔹 pagamentos já registrados manualmente
    const payments = await PartnerPayment.find().lean()

    const partnerRows = partners.map((p: any) => {
      const id = p._id.toString()

      // Pedidos desse parceiro = todos pedidos do siteSlug dele
      const partnerOrders = orders.filter(
        (o) => o.siteSlug === p.siteSlug,
      )

      // Faturamento bruto (totalAmountInCents -> R$)
      const totalGross = partnerOrders.reduce(
        (acc, o) => acc + (o.totalAmountInCents ?? 0) / 100,
        0,
      )

      // Lucro líquido (netAmountInCents -> R$)
      const totalNet = partnerOrders.reduce(
        (acc, o) => acc + (o.netAmountInCents ?? 0) / 100,
        0,
      )

      // Sua parte: 30% do lucro
      const myCommission = totalNet * 0.3

      // Pagamentos já feitos pra esse parceiro
      const partnerPayments = payments.filter(
        (pg: any) => String(pg.partnerId) === id,
      )

      const totalPaid = partnerPayments.reduce(
        (acc, pg: any) => acc + (pg.amount ?? 0),
        0,
      )

      const balance = myCommission - totalPaid

      return {
        partnerId: id,
        partnerName: p.partnerName || 'Sem nome',
        siteSlug: p.siteSlug,
        siteName: p.siteName || p.siteSlug,

        totalGross: Number(totalGross.toFixed(2)),
        totalNet: Number(totalNet.toFixed(2)),
        myCommission: Number(myCommission.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        balance: Number(balance.toFixed(2)),

        payments: partnerPayments.map((pg: any) => ({
          id: String(pg._id),
          amount: pg.amount,
          note: pg.note || '',
          createdAt: pg.createdAt,
        })),
      }
    })

    // Se veio ?partnerId=, retorna só aquele
    if (partnerId) {
      const row = partnerRows.find((p) => p.partnerId === partnerId)
      return NextResponse.json(row || {})
    }

    // Caso contrário, lista geral
    return NextResponse.json({ partners: partnerRows })
  } catch (err) {
    console.error('[GET /api/relatorios] erro:', err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { partnerId, amount, note } = await req.json()

    if (!partnerId || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 },
      )
    }

    const payment = await PartnerPayment.create({
      partnerId,
      amount,
      note: note || '',
      createdAt: new Date(),
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('[POST /api/relatorios] erro:', err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 },
    )
  }
}
