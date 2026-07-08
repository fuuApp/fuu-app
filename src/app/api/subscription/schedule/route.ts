import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// ダウングレード予約情報を返す（plans/page で常時バナー表示に使用）
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ scheduledDowngradeAt: null })

  try {
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ scheduledDowngradeAt: null })
    }

    // アクティブなサブスクを取得
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (!subs.data.length || !subs.data[0].schedule) {
      return NextResponse.json({ scheduledDowngradeAt: null })
    }

    const sub = subs.data[0]
    const scheduleId = typeof sub.schedule === 'string'
      ? sub.schedule
      : (sub.schedule as { id: string }).id

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)

    // フェーズ1の終了日 = ダウングレード適用日
    const phase1End = schedule.phases[0]?.end_date

    return NextResponse.json({
      scheduledDowngradeAt: phase1End
        ? new Date(phase1End * 1000).toISOString()
        : null,
    })
  } catch (error: any) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json({ scheduledDowngradeAt: null })
  }
}
