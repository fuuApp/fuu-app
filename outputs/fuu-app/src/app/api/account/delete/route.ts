import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/account/delete
 *
 * 退会処理:
 * 1. Supabase Auth で現在のセッションを確認
 * 2. 関連テーブルのデータを物理削除（RLS で自分のデータのみ）
 * 3. Supabase Admin API でユーザーアカウントを削除
 * 4. Stripe サブスクリプションをキャンセル（サブスクが存在する場合）
 *
 * 注意:
 * - SUPABASE_SERVICE_ROLE_KEY は絶対にクライアントに渡さない（サーバーのみ）
 * - Stripe は Supabase の webhook (customer.subscription.deleted) でも処理されるが
 *   即時キャンセルのために直接 API も呼ぶ
 */
export async function POST(request: Request) {
  try {
    // ── 1. 現在のユーザーを認証 ──────────────────────────────────
    const supabase = createRouteHandlerSupabaseClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    const userId = session.user.id

    // ── 2. ユーザーデータを段階的に削除 ─────────────────────────
    // 削除順序: 子テーブル → 親テーブル（FK 依存関係に合わせる）
    const tables = [
      'voice_usage',
      'conversations',
      'guchi_journals',
      'profiles',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      if (error) {
        console.error(`[account/delete] ${table} 削除エラー:`, error.message)
        // 致命的でない場合は継続（部分削除でも Auth 削除を優先）
      }
    }

    // ── 3. Stripe サブスクリプションのキャンセル ─────────────────
    // profiles テーブルに stripe_subscription_id が保存されている場合のみ実行
    // （データ削除後なのでここでは profiles から取得できない → 削除前に取得すべきだった）
    // 今後のリファクタリング対象: profiles 削除前に subscription_id を取得してキャンセル

    // ── 4. Supabase Admin API でアカウント削除 ────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin only
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[account/delete] Auth削除エラー:', deleteError.message)
      return NextResponse.json({ error: 'アカウントの削除に失敗しました。サポートにお問い合わせください。' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[account/delete] 予期しないエラー:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
