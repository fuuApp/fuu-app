/**
 * 退会API — 論理削除 + Stripeサブスク即時キャンセル
 *
 * セキュリティ：
 *   - Authorization ヘッダーのJWTからユーザーIDを検証
 *   - 他ユーザーのデータを誤って削除できない設計
 *
 * 削除スケジュール（pg_cronが自動実行）：
 *   退会後3日以内  : 会話・ジャーナル削除
 *   退会後30日     : プロフィール削除
 *   退会後90日     : 取引履歴削除
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // ── 1. Authorization ヘッダーからJWTを取得・検証 ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = user.id

    // ── 2. プロフィール取得 ──
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, stripe_customer_id, plan')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // ── 3. Stripeサブスクを即時キャンセル（有料ユーザーのみ）──
    if (profile.stripe_customer_id && profile.plan !== 'free' && profile.plan !== 'trial') {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 10,
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (stripeErr) {
        console.error('Stripe cancellation error:', stripeErr)
        // Stripeエラーは記録するが退会処理は続行
      }
    }

    // ── 4. profilesを論理削除（pg_cronが以降の段階削除を担当）──
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        plan: 'free',
        stripe_customer_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Soft delete error:', deleteError)
      return NextResponse.json({ error: '退会処理に失敗しました' }, { status: 500 })
    }

    // ── 5. Supabase Authからセッション無効化 ──
    await supabase.auth.admin.deleteUser(userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Account delete error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
