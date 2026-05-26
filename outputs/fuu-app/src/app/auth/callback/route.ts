import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Supabase マジックリンク認証コールバック
 *
 * メールのリンクをクリックするとここに来る：
 *   /auth/callback?code=xxxx&next=/app/chat/aoi
 *
 * やること：
 *   1. code を session トークンに交換（これで Cookie が設定される）
 *   2. profiles テーブルに upsert（初回ログイン時にレコード作成）
 *   3. next パラメータ or /app へリダイレクト
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  // code がない場合はログインページへ
  if (!code) {
    console.error('[auth/callback] code parameter missing')
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // ─── レスポンス（Cookie を書くために必要） ───────────────────
  let res = NextResponse.redirect(`${origin}${next}`)

  // ─── Supabase クライアント（Edge） ──────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ─── code → session 交換 ─────────────────────────────────────
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // ─── プロフィール upsert（初回ログイン時のみ実質的に insert） ──
  const user = data.session.user
  try {
    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        email: user.email ?? '',
        plan: 'trial',
        trial_started_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
        // 既存レコードがある場合は何もしない（trial_started_at を保持）
        ignoreDuplicates: true,
      }
    )
  } catch (profileError) {
    // プロフィール作成に失敗してもログイン自体はさせる（ログだけ残す）
    console.error('[auth/callback] profile upsert failed:', profileError)
  }

  return res
}
