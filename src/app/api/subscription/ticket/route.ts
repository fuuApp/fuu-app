import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    const priceId = process.env.STRIPE_PRICE_TICKET
    if (!priceId || priceId === 'price_...') {
      return NextResponse.json({ error: 'チケット価格が設定されていません' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fuu-app.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/plans?ticket_success=true`,
      cancel_url:  `${baseUrl}/app/plans?canceled=true`,
      customer_email: email ?? undefined,
      metadata: {
        userId: userId ?? '',
        type: 'ticket',
      },
      locale: 'ja',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Ticket checkout error:', error)
    return NextResponse.json(
      { error: 'チケット購入の初期化に失敗しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
