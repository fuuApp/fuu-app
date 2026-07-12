import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  timeout: 15000,
  maxNetworkRetries: 0,
})

const PRICE_MAP: Record<string, string> = {
  standard: process.env.STRIPE_PRICE_STANDARD!,
  premium:  process.env.STRIPE_PRICE_PREMIUM!,
}

// プランの月額金額（アップグレード・ダウングレード判定用）
const PLAN_AMOUNTS: Record<string, number> = {
  standard: 300,
  premium:  980,
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()

    const priceId = PRICE_MAP[plan]
    if (!priceId) {
      return NextResponse.json({ error: '無効なプランです' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fuu-app.vercel.app'

    // ── 既存の顧客・サブスク情報を取得 ──────────────────────
    const supabase = createAdminClient()
    let existingCustomerId: string | null = null
    let existingSubscriptionId: string | null = null

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()

      existingCustomerId = profile?.stripe_customer_id ?? null

      // stripe_customer_id がDBに未保存でもメールで顧客を検索（webhook遅延対策）
      if (!existingCustomerId && email) {
        const customers = await stripe.customers.list({ email, limit: 1 })
        if (customers.data.length > 0) {
          existingCustomerId = customers.data[0].id
        }
      }

      if (existingCustomerId) {
        // DBではなくStripe APIを直接確認（webhook遅延による取りこぼし防止）
        const stripeSubs = await stripe.subscriptions.list({
          customer: existingCustomerId,
          status: 'active',
          limit: 1,
        })
        if (stripeSubs.data.length > 0) {
          existingSubscriptionId = stripeSubs.data[0].id
        } else {
          // active がなければ trialing も確認
          const trialSubs = await stripe.subscriptions.list({
            customer: existingCustomerId,
            status: 'trialing',
            limit: 1,
          })
          if (trialSubs.data.length > 0) {
            existingSubscriptionId = trialSubs.data[0].id
          }
        }
      }
    }

    // ── プラン変更（既存サブスクあり） ───────────────────────
    if (existingSubscriptionId) {
      const currentSub = await stripe.subscriptions.retrieve(existingSubscriptionId)
      const currentPriceId = currentSub.items.data[0]?.price.id

      // すでに同じプランなら何もしない
      if (currentPriceId === priceId) {
        return NextResponse.json({ alreadyOnPlan: true })
      }

      const currentPlanName = Object.keys(PRICE_MAP).find(p => PRICE_MAP[p] === currentPriceId) ?? 'standard'
      const isDowngrade = (PLAN_AMOUNTS[currentPlanName] ?? 0) > (PLAN_AMOUNTS[plan] ?? 0)

      if (isDowngrade) {
        // ── ダウングレード：期末適用（subscription schedule） ──
        // 現在の課金期間終了まではプレミアム継続、翌月からスタンダードに移行

        // 既存のScheduleがあれば先にリリース（重複エラー・フェーズ日付エラー防止）
        if (currentSub.schedule) {
          const existingScheduleId = typeof currentSub.schedule === 'string'
            ? currentSub.schedule
            : (currentSub.schedule as { id: string }).id
          await stripe.subscriptionSchedules.release(existingScheduleId)
        }

        // 新規Scheduleを作成
        const newSchedule = await stripe.subscriptionSchedules.create({
          from_subscription: existingSubscriptionId,
        })

        // from_subscription で作成したScheduleの現フェーズのstart_dateを引き継ぐ
        // （end_dateのアンカーとして必須）
        const phaseStartDate = newSchedule.phases[0]?.start_date
          ?? Math.floor(Date.now() / 1000)

        await stripe.subscriptionSchedules.update(newSchedule.id, {
          end_behavior: 'release', // スケジュール終了後は通常のサブスクとして継続
          phases: [
            {
              // フェーズ1：現在のプランを課金期間終了まで維持
              items: [{ price: currentPriceId, quantity: 1 }],
              start_date: phaseStartDate,
              end_date: currentSub.current_period_end,
              proration_behavior: 'none',
            },
            {
              // フェーズ2：次の課金期間からダウングレード後のプランを適用
              items: [{ price: priceId, quantity: 1 }],
              proration_behavior: 'none',
            },
          ],
        })

        const effectiveDate = new Date(currentSub.current_period_end * 1000).toISOString()
        return NextResponse.json({ scheduled: true, effectiveDate })
      } else {
        // ── アップグレード：即時適用（日割り精算あり） ──────────
        // スケジュール管理下（ダウングレード予約中 or フェーズ2稼働中）の場合は先にリリース
        if (currentSub.schedule) {
          const schedId = typeof currentSub.schedule === 'string'
            ? currentSub.schedule
            : (currentSub.schedule as { id: string }).id
          await stripe.subscriptionSchedules.release(schedId)
        }
        await stripe.subscriptions.update(existingSubscriptionId, {
          items: [{ id: currentSub.items.data[0].id, price: priceId }],
          proration_behavior: 'create_prorations',
          metadata: { userId: userId ?? '', plan },
        })
        return NextResponse.json({ updated: true })
      }
    }

    // ── 新規チェックアウト（既存顧客IDがあれば再利用） ────────
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/plans?success=true&plan=${plan}`,
      cancel_url:  `${baseUrl}/app/plans?canceled=true`,
      // 既存顧客IDがあれば customer を指定（重複顧客防止）
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: email ?? undefined }
      ),
      metadata: { userId: userId ?? '', plan },
      subscription_data: {
        metadata: { userId: userId ?? '', plan },
      },
      locale: 'ja',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    const detail = {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
      raw: error?.raw,
    }
    return NextResponse.json(
      { error: `[Stripe] ${error?.message ?? '不明なエラー'}`, detail },
      { status: 500 }
    )
  }
}
