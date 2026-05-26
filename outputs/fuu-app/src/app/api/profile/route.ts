import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/profile
 *
 * 新規ユーザーのプロフィールを作成（upsert）
 * auth/callback ページから呼ばれる。
 * Supabase の DB Trigger でも代替可能だが、明示的 API で管理する。
 *
 * 作成する profiles レコード:
 * - user_id: auth.users の UUID
 * - email: メールアドレス
 * - plan: 'trial'
 * - trial_started_at: NOW()
 * - created_at: NOW()
 *
 * GET /api/profile
 * 現在のユーザーのプロフィールを返す（サブスクステータス等）
 */

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { user } = session

    // upsert: 既存レコードがある場合は更新しない（created_at などを保持）
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? '',
          plan: 'trial',
          trial_started_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: true, // 既存レコードがあれば何もしない
        }
      )
      .select()
      .single()

    if (error && error.code !== '23505') {
      // 23505 = unique violation（既存ユーザー）は正常
      console.error('[api/profile POST] upsert error:', error.message)
      return NextResponse.json({ error: 'プロフィール作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (err: any) {
    console.error('[api/profile POST] unexpected error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, plan, trial_started_at, stripe_customer_id, stripe_subscription_id, push_token, morning_time, notification_time, created_at')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      // レコードがない場合は空プロフィールを返す
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null })
      }
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err: any) {
    console.error('[api/profile GET] unexpected error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
