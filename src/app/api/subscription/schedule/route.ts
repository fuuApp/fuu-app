import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

// Capacitorビルド（output: export）時は force-static でビルドエラーを回避
// Vercel通常デプロイ時は force-dynamic でリクエストパラメータを使用
export const dynamic = process.env.CAPACITOR_BUILD === 'true' ? 'force-static' : 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// サブスク予約状態を返す（plans/page・settings/page で常時バナー表示に使用）
// - scheduledDowngradeAt: ダウングレード予約日（Stripeスケジュール）
// - pendingWithdrawal: 退会予約中かどうか（cancel_at_period_end + pending_deletion）
// - withdrawalDate: 退会（アカウント削除）予定日
// - cancelAtPeriodEnd: 通常解約予約中（期末まで利用可能）
// - cancelDate: 解約後の利用終了日
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const empty = { scheduledDowngradeAt: null, pendingWithdrawal: false, withdrawalDate: null, cancelAtPeriodEnd: false, cancelDate: null }
  if (!userId) return NextResponse.json(empty)

  try {
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(empty)
    }

    // アクティブなサブスクを取得
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (!subs.data.length) {
      return NextResponse.json(empty)
    }

    const sub = subs.data[0]

    // ── 退会予約チェック（cancel_at_period_end + pending_deletion メタデータ）──
    const pendingWithdrawal = sub.cancel_at_period_end === true && sub.metadata?.pending_deletion === 'true'
    const withdrawalDate = pendingWithdrawal && sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null

    // ── 通常の解約予約チェック（Stripe Customer Portal からキャンセル）──
    // cancel_at_period_end: true だが pending_deletion メタデータはなし
    // → 期末まで利用可能で、そのまま終了
    const cancelAtPeriodEnd = sub.cancel_at_period_end === true && sub.metadata?.pending_deletion !== 'true'
    const cancelDate = cancelAtPeriodEnd && sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null

    // スケジュールがない場合はダウングレード予約なし
    if (!sub.schedule) {
      return NextResponse.json({ scheduledDowngradeAt: null, pendingWithdrawal, withdrawalDate, cancelAtPeriodEnd, cancelDate })
    }

    // ── ダウングレード予約チェック（Stripeスケジュール）──
    const scheduleId = typeof sub.schedule === 'string'
      ? sub.schedule
      : (sub.schedule as { id: string }).id

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)

    // フェーズ1の終了日 = ダウングレード適用日
    // 過去の日付の場合は null を返す（移行済みバナーの誤表示防止）
    const phase1End = schedule.phases[0]?.end_date
    const now = Math.floor(Date.now() / 1000)
    const isUpcoming = phase1End && phase1End > now

    return NextResponse.json({
      scheduledDowngradeAt: isUpcoming
        ? new Date(phase1End * 1000).toISOString()
        : null,
      pendingWithdrawal,
      withdrawalDate,
      cancelAtPeriodEnd,
      cancelDate,
    })
  } catch (error: any) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json({ scheduledDowngradeAt: null, pendingWithdrawal: false, withdrawalDate: null, cancelAtPeriodEnd: false, cancelDate: null })
  }
}
