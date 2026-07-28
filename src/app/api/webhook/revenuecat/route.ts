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

  console.log('[RC webhook] raw body keys:', JSON.stringify(Object.keys(body || {})))
  console.log('[RC webhook] raw body:', JSON.stringify(body))

  const event = body?.event
  if (!event) {
    console.log('[RC webhook] SKIPPED: no event field in body')
    return NextResponse.json({ received: true })
  }

  const { type, app_user_id, product_id, new_product_id } = event
  // PRODUCT_CHANGE は new_product_id が新しいプラン、product_id は旧プラン
  const effectiveProductId = type === 'PRODUCT_CHANGE' ? (new_product_id ?? product_id) : product_id

  console.log('[RC webhook]', JSON.stringify({ type, app_user_id, product_id, new_product_id, effectiveProductId }))

  // app_user_id is the Supabase user UUID we passed as appUserID to Purchases.configure()
  if (!app_user_id) {
    console.log('[RC webhook] SKIPPED: no app_user_id')
    return NextResponse.json({ received: true })
  }

  // プランランク（アップグレード判定用）
  const PLAN_RANK: Record<string, number> = { free: 0, standard: 1, premium: 2 }

  try {
    if (type === 'NON_RENEWING_PURCHASE' && CONSUMABLE_PRODUCTS.has(product_id as string)) {
      // 消耗型チケット購入（RevenueCatはconsumableをNON_RENEWING_PURCHASEで送信）
      const transactionId = event.transaction_id ?? event.original_transaction_id ?? `rc_${Date.now()}`
      console.log('[RC webhook] consumable purchase, transactionId:', transactionId)
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
            stripe_payment_intent_id: transactionId,
            expires_at: expiresAt,
          })
        if (error) throw error
        console.log('[RC webhook] ticket inserted for user:', app_user_id)
      } else {
        console.log('[RC webhook] ticket already exists, skipping')
      }
    } else if (type === 'PRODUCT_CHANGE') {
      // プラン変更：アップグレードは即時反映、ダウングレードは期末まで猶予
      const oldPlan = PRODUCT_TO_PLAN[product_id as string]
      const newPlan = PRODUCT_TO_PLAN[effectiveProductId as string] // effectiveProductId = new_product_id
      console.log('[RC webhook] PRODUCT_CHANGE:', oldPlan, '→', newPlan)
      if (newPlan) {
        const isUpgrade = (PLAN_RANK[newPlan] ?? 0) > (PLAN_RANK[oldPlan] ?? 0)
        if (isUpgrade) {
          // アップグレード：即時反映、スケジュールをクリア
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ plan: newPlan, scheduled_plan: null, scheduled_plan_at: null })
            .eq('user_id', app_user_id)
          if (error) throw error
          console.log('[RC webhook] upgrade applied immediately:', newPlan)
        } else {
          // ダウングレード：現在のplanは維持し、スケジュールとして保存
          const expirationMs = event.expiration_at_ms
          const scheduledAt = expirationMs ? new Date(expirationMs).toISOString() : null
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ scheduled_plan: newPlan, scheduled_plan_at: scheduledAt })
            .eq('user_id', app_user_id)
          if (error) throw error
          console.log('[RC webhook] downgrade scheduled:', newPlan, 'at:', scheduledAt)
        }
      }
    } else if (type === 'RENEWAL' || type === 'INITIAL_PURCHASE' || type === 'UNCANCELLATION') {
      const plan = PRODUCT_TO_PLAN[effectiveProductId as string]
      console.log('[RC webhook] plan resolved:', plan, 'for effectiveProductId:', effectiveProductId)
      if (plan) {
        // 更新・新規購入：プラン反映 + スケジュールをクリア
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ plan, scheduled_plan: null, scheduled_plan_at: null })
          .eq('user_id', app_user_id)
        if (error) throw error
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
