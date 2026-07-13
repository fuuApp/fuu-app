import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Stripe カスタマーポータルへのリダイレクト
// 有料ユーザーが自分でサブスク管理（解約・プラン変更）できるページを生成
export async function GET() {
  try {
    // 認証チェック
    const supabaseClient = await createRouteHandlerClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // stripe_customer_id を取得
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single()

    // 有料プランでなければプランページへ（JSONでリダイレクト先を返す）
    if (!profile?.stripe_customer_id || profile.plan === 'trial' || profile.plan === 'free') {
      return NextResponse.json({ redirect: '/app/plans' })
    }

    // Stripe カスタマーポータルセッションを作成
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fuu-app.vercel.app'}/app/settings`,
    })

    // JSON を返す（クライアント側で window.open でシステムブラウザに開かせる）
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}
