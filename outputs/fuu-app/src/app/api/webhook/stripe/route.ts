import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'

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
        const priceId = sub.items.data[0]?.price.id
        const plan = PLAN_PRICE_MAP[priceId] ?? 'standard'

        // stripe_customer_id からユーザーを特定
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase.from('profiles').update({
            plan,
            stripe_subscription_id: sub.id,
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

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase.from('profiles').update({
            plan: 'trial',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('user_id', profile.user_id)

          await supabase.from('subscriptions').update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', sub.id)
        }
        break
      }

      // ─── チケット購入（one-time payment）────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.mode === 'payment' && session.metadata?.type === 'ticket') {
          const userId = session.metadata.user_id
          const quantity = parseInt(session.metadata.quantity ?? '1')

          await supabase.from('tickets').insert({
            user_id: userId,
            quantity,
            stripe_payment_intent_id: session.payment_intent,
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
