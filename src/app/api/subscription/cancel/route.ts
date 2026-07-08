/**
 * サブスクリプション解約API
 * POST /api/subscription/cancel
 * - cancel_at_period_end: true でキャンセル（次回更新日まで利用可能）
 * - pendingDeletion: true の場合、期末にアカウントも自動削除（退会予約）
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    // pendingDeletion: 退会予約フラグ（期末にアカウントも削除）
    let pendingDeletion = false
    try {
      const body = await req.json()
      pendingDeletion = body?.pendingDeletion ?? false
    } catch { /* body なし = 通常の解約 */ }

    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const admin = createAdminClient()

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

    // スケジュール管理下（ダウングレード予約中）の場合は先にリリース
    // （cancel_at_period_end はスケジュール管理下では直接設定不可）
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    if (stripeSub.schedule) {
      const schedId = typeof stripeSub.schedule === 'string'
        ? stripeSub.schedule
        : (stripeSub.schedule as { id: string }).id
      await stripe.subscriptionSchedules.release(schedId)
    }

    const canceled = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
      // pendingDeletion の場合、期末に webhook がアカウント削除を実行するためのフラグを設定
      ...(pendingDeletion ? {
        metadata: { pending_deletion: 'true', userId: user.id },
      } : {}),
    })

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
