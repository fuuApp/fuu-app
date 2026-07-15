import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

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

    // 既存の Stripe 顧客 ID を取得（保存済みカード・Apple Pay / Google Pay を Checkout で選択可能にする）
    let existingCustomerId: string | null = null
    if (userId) {
      const supabase = createAdminClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()
      existingCustomerId = profile?.stripe_customer_id ?? null

      // DBに未保存でもメールで顧客を検索（webhook遅延対策）
      if (!existingCustomerId && email) {
        const customers = await stripe.customers.list({ email, limit: 1 })
        if (customers.data.length > 0) {
          existingCustomerId = customers.data[0].id
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // payment_method_types を省略することで Stripe が自動的に最適な支払い方法を選択
      // → JCB・Apple Pay・Google Pay が Stripe ダッシュボードの設定に基づいて有効化される
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/plans?ticket_success=true`,
      cancel_url:  `${baseUrl}/app/plans?canceled=true`,
      // 顧客 ID があれば渡す（保存済みカードがデフォルト表示・別カード／Apple Pay も選択可）
      // なければメールアドレスを渡してフォームに自動入力
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: email ?? undefined }
      ),
      metadata: {
        user_id: userId ?? '',  // webhookと統一（user_id）
        type: 'ticket',
      },
      allow_promotion_codes: true,
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
