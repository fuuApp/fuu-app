import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// プランID → Stripe Price ID マッピング
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD,
  premium: process.env.STRIPE_PRICE_PREMIUM,
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()

    // ─── バリデーション ─────────────────────────────────────────
    if (!plan || !['standard', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: '無効なプランです。standard または premium を指定してください。' },
        { status: 400 }
      )
    }

    const priceId = PLAN_PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe Price IDが設定されていません。環境変数を確認してください。' },
        { status: 500 }
      )
    }

    // ─── ログインユーザーを確認 ──────────────────────────────────
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // ─── 既存のStripe CustomerID を取得（or 新規作成） ──────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Stripeにカスタマーを新規作成
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id

      // DBにStripe Customer IDを保存
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // ─── Stripe Checkout セッション作成 ─────────────────────────
    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 支払い完了後のリダイレクト先
      success_url: `${origin}/app/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/plans?canceled=true`,
      metadata: {
        user_id: userId,
        plan,
      },
      // サブスクリプションのトライアル設定（Stripeダッシュボードでも設定可）
      subscription_data: {
        metadata: {
          user_id: userId,
          plan,
        },
      },
      // 日本語UI
      locale: 'ja',
      // 領収書メール自動送信
      payment_intent_data: undefined,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe Checkout error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripeエラー: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '決済の準備中にエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
