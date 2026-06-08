import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const PRICE_MAP: Record<string, string> = {
  standard: process.env.STRIPE_PRICE_STANDARD!,
  premium:  process.env.STRIPE_PRICE_PREMIUM!,
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()

    const priceId = PRICE_MAP[plan]
    if (!priceId) {
      return NextResponse.json({ error: '無効なプランです' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fuu-app.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // payment_method_types を省略することで Stripe が自動的に最適な支払い方法を選択
      // → JCB・Apple Pay・Google Pay・Link が Stripe ダッシュボードの設定に基づいて有効化される
      allow_promotion_codes: true, // プロモーションコード（割引クーポン）入力欄を表示
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/plans?success=true`,
      cancel_url:  `${baseUrl}/app/plans?canceled=true`,
      customer_email: email ?? undefined,
      metadata: { userId: userId ?? '', plan },
      subscription_data: {
        metadata: { userId: userId ?? '', plan },
      },
      locale: 'ja',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: '決済の初期化に失敗しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
