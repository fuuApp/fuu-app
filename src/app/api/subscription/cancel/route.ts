/**
 * サブスクリプション解約API
 * POST /api/subscription/cancel
 * - Stripeのサブスクリプションをcancel_at_period_end: trueでキャンセル
 * - 次回更新日まで利用可能、日割り返金なし
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const admin = createAdminClient()

    // アクティブなサブスクリプションを取得
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'アクティブなサブスクリプションが見つかりません' }, { status: 404 })
    }

    // Stripeでperiod_end時にキャンセル（即時解約ではない）
    const canceled = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Supabaseのstatusを更新
    await admin
      .from('subscriptions')
      .update({ status: 'cancel_at_period_end' })
      .eq('stripe_subscription_id', sub.stripe_subscription_id)

    return NextResponse.json({
      success: true,
      cancelAt: canceled.cancel_at
        ? new Date(canceled.cancel_at * 1000).toLocaleDateString('ja-JP')
        : null,
    })
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: error.message ?? '解約処理に失敗しました' }, { status: 500 })
  }
}
