import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// RevenueCat product ID → Supabase plan
const PRODUCT_TO_PLAN: Record<string, string> = {
  fuu_premium_monthly: 'premium',
  fuu_standard_monthly: 'standard',
}

// Consumable products (handled separately from subscriptions)
const CONSUMABLE_PRODUCTS = new Set(['fuu_ticket_daily'])

// These event types mean the user has an active subscription
const ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
])

export async function POST(req: NextRequest) {
  // Verify shared secret (set in RevenueCat dashboard → Webhooks → Authorization header)
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { event?: Record<string, any> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body?.event
  if (!event) return NextResponse.json({ received: true })

  const { type, app_user_id, product_id } = event

  // app_user_id is the Supabase user UUID we passed as appUserID to Purchases.configure()
  if (!app_user_id) return NextResponse.json({ received: true })

  try {
    if (ACTIVATE_EVENTS.has(type)) {
      const plan = PRODUCT_TO_PLAN[product_id as string]
      if (plan) {
        // サブスクリプション購入 → プラン更新
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ plan })
          .eq('user_id', app_user_id)
        if (error) throw error
      } else if (type === 'INITIAL_PURCHASE' && CONSUMABLE_PRODUCTS.has(product_id as string)) {
        // 消耗型チケット購入 → ticketsテーブルに挿入
        const transactionId = event.transaction_id ?? event.original_transaction_id ?? `rc_${Date.now()}`
        // 重複挿入を防ぐため既存チェック
        const { data: existing } = await supabaseAdmin
          .from('tickets')
          .select('id')
          .eq('stripe_payment_intent_id', transactionId)
          .maybeSingle()
        if (!existing) {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          const { error } = await supabaseAdmin
            .from('tickets')
            .insert({
              user_id: app_user_id,
              quantity: 1,
              used: 0,
              stripe_payment_intent_id: transactionId, // RevenueCat transaction ID を流用
              expires_at: expiresAt,
              purchased_at: new Date().toISOString(),
            })
          if (error) throw error
        }
      }
    } else if (type === 'EXPIRATION') {
      // Subscription fully expired — revoke access
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free' })
        .eq('user_id', app_user_id)
      if (error) throw error
    }
    // CANCELLATION: user cancelled but still active until period end — do nothing (EXPIRATION handles it)
    // BILLING_ISSUE: grace period active — do nothing yet
  } catch (err) {
    console.error('[RevenueCat webhook] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
