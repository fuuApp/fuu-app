import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const { userId, email, upgradeTo } = await req.json()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fuu-app.vercel.app'

    let customerId: string | null = null
    if (userId) {
      const supabase = createAdminClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()
      customerId = profile?.stripe_customer_id ?? null

      if (!customerId && email) {
        const customers = await stripe.customers.list({ email, limit: 1 })
        if (customers.data.length > 0) customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: '顧客情報が見つかりません' }, { status: 400 })
    }

    // 決済手段の変更のみ（サブスク更新機能は不要）
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/app/plans?payment_updated=true${upgradeTo ? `&upgrade_to=${upgradeTo}` : ''}`,
      flow_data: {
        type: 'payment_method_update',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
