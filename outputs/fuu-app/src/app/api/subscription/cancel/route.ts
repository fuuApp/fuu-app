import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/subscription/cancel
 *
 * Stripe サブスクリプションをキャンセル。
 * - cancel_at_period_end: true → 今月末で終了（即時ダウングレード）
 * - profiles.plan は Stripe webhook (customer.subscription.deleted) が
 *   'trial' に戻す。Webhook 設定後は手動更新不要。
 *
 * 使用例（フロント）:
 * ```ts
 * const res = await fetch('/api/subscription/cancel', { method: 'POST' })
 * ```
 */
export async function POST(request: Request) {
  // ── 1. 認証確認 ──────────────────────────────────────────────
  const supabase = createRouteHandlerSupabaseClient(request)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    // ── 2. プロフィールから subscription_id を取得 ──────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, plan')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ error: '有効なサブスクリプションが見つかりません' }, { status: 400 })
    }

    if (profile.plan === 'trial') {
      return NextResponse.json({ error: 'トライアルプランのキャンセルは退会からどうぞ' }, { status: 400 })
    }

    // ── 3. Stripe でキャンセル（月末で終了） ──────────────────
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    )

    // ── 4. profiles テーブルを更新（webhook が来るまでの間に UI を反映） ──
    await supabase
      .from('profiles')
      .update({ plan: 'canceling' }) // canceling = 月末まで有効・更新なし
      .eq('user_id', session.user.id)

    return NextResponse.json({
      success: true,
      cancelAt: new Date(subscription.cancel_at! * 1000).toISOString(),
      message: `${new Date(subscription.cancel_at! * 1000).toLocaleDateString('ja-JP')}にサブスクリプションが終了します`,
    })

  } catch (err: any) {
    console.error('[subscription/cancel] Stripe error:', err.message)
    return NextResponse.json({ error: 'キャンセル処理に失敗しました。しばらくしてから再試行してください。' }, { status: 500 })
  }
}
