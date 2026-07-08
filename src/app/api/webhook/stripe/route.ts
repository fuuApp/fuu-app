import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const PLAN_PRICE_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STANDARD!]: 'standard',
  [process.env.STRIPE_PRICE_PREMIUM!]: 'premium',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // ─── サブスクリプション開始 ───────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        let priceId = sub.items.data[0]?.price.id

        // スケジュール管理下の場合、現フェーズのpriceで判断する
        // （スケジュール設定時のwebhookでダウングレードされるのを防ぐ）
        if (sub.schedule) {
          try {
            const scheduleId = typeof sub.schedule === 'string'
              ? sub.schedule
              : (sub.schedule as Stripe.SubscriptionSchedule).id
            const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
            const now = Math.floor(Date.now() / 1000)
            // 現在時刻が含まれるフェーズを探す（end_dateがnull/0は無期限）
            const currentPhase = schedule.phases.find(p =>
              p.start_date <= now && (!p.end_date || p.end_date > now)
            )
            const rawPrice = currentPhase?.items?.[0]?.price
            if (rawPrice) {
              const pId = typeof rawPrice === 'string' ? rawPrice : rawPrice.id
              if (pId) priceId = pId
            }
          } catch { /* 取得失敗時はsub.itemsのpriceIdをそのまま使う */ }
        }

        const plan = PLAN_PRICE_MAP[priceId] ?? 'standard'

        // まず stripe_customer_id でユーザーを特定
        let { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        // 見つからない場合は subscription.metadata.userId でフォールバック
        // （checkout.session.completed より先に発火した場合の保険）
        if (!profile && sub.metadata?.userId) {
          const { data: fallback } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', sub.metadata.userId)
            .single()
          if (fallback) {
            profile = fallback
            // stripe_customer_id を保存しておく
            await supabase.from('profiles').update({
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            }).eq('user_id', fallback.user_id)
          }
        }

        if (profile) {
          await supabase.from('profiles').update({
            plan,
            updated_at: new Date().toISOString(),
          }).eq('user_id', profile.user_id)

          await supabase.from('subscriptions').upsert({
            user_id: profile.user_id,
            stripe_subscription_id: sub.id,
            plan,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_subscription_id' })
        }
        break
      }

      // ─── サブスクリプション終了・解約 ────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        // ── 退会予約の場合: アカウントを完全削除 ──────────────
        if (sub.metadata?.pending_deletion === 'true' && sub.metadata?.userId) {
          const userId = sub.metadata.userId
          await supabase.from('subscriptions').update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', sub.id)
          await supabase.from('profiles').update({
            deleted_at: new Date().toISOString(),
            plan: 'free',
            stripe_customer_id: null,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId)
          await supabase.auth.admin.deleteUser(userId)
          break
        }

        // ── 通常の解約: 他にアクティブなサブスクが残っているか確認してからplan更新 ──
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          // 削除されたサブスク以外にアクティブなサブスクが残っているか確認
          const remainingSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 10,
          })
          const activeSubs = remainingSubs.data.filter(s => s.id !== sub.id)

          if (activeSubs.length > 0) {
            // 残っているサブスクのプランを反映（道連れcanceled防止）
            const remainingPriceId = activeSubs[0].items.data[0]?.price.id
            const remainingPlan = PLAN_PRICE_MAP[remainingPriceId] ?? 'standard'
            await supabase.from('profiles').update({
              plan: remainingPlan,
              updated_at: new Date().toISOString(),
            }).eq('user_id', profile.user_id)
          } else {
            // 他にアクティブなサブスクがない場合のみ canceled に
            await supabase.from('profiles').update({
              plan: 'canceled',
              updated_at: new Date().toISOString(),
            }).eq('user_id', profile.user_id)
          }

          await supabase.from('subscriptions').update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', sub.id)
        }
        break
      }

      // ─── Checkout完了 ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          // サブスクリプション決済完了：stripe_customer_id を profiles に保存
          // （これを先にやることで subscription.created/updated でユーザー特定できる）
          // プラン変更・新規契約時は monthly_chat_count をリセットして新しいプランの上限から始める
          const userId = session.metadata?.userId ?? session.metadata?.user_id
          const customerId = session.customer as string
          if (userId && customerId) {
            await supabase.from('profiles').update({
              stripe_customer_id: customerId,
              monthly_chat_count: 0,
              monthly_chat_reset_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('user_id', userId)
          }
        } else if (session.mode === 'payment' && session.metadata?.type === 'ticket') {
          // チケット購入（one-time payment）
          // ticket APIは metadata.userId で送信 → user_id / userId どちらにも対応
          const userId = session.metadata.user_id ?? session.metadata.userId
          const quantity = parseInt(session.metadata.quantity ?? '1')

          // ¥0クーポン使用時はpayment_intentがnullになる場合があるため
          // stripe_payment_intent_idはsession.idで代替（nullのまま入れると制約違反の可能性）
          const paymentIntentId = session.payment_intent ?? `cs_${session.id}`
          // expires_at: 購入から30日後（設定しないとactivate-ticketの.gt('expires_at')クエリにヒットしない）
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('tickets').insert({
            user_id: userId,
            quantity,
            stripe_payment_intent_id: paymentIntentId,
            expires_at: expiresAt,
            purchased_at: new Date().toISOString(),
          })
        }
        break
      }

      default:
        // 未処理イベントは無視
        break
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
