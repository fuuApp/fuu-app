import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Supabaseが設定済みかどうかを判定
const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ─── Supabase未設定時（デモモード）はすべてスルー ──────────
  if (!isSupabaseConfigured) {
    return NextResponse.next()
  }

  // ─── レスポンスを作成（Cookie書き込みのため） ───────────────
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  // ─── Supabase クライアント（Edge対応） ──────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ─── セッション取得（Cookie を自動リフレッシュ） ────────────
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ─── /app/* へのアクセス保護 ────────────────────────────────
  if (pathname.startsWith('/app')) {
    if (!session) {
      // 未ログイン → ログインページへリダイレクト
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      // ログイン後に元のURLへ戻れるようにパラメータを付ける
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ─── ログイン済みユーザーが /login にアクセスした場合 ────────
  if (pathname === '/login' && session) {
    const appUrl = req.nextUrl.clone()
    appUrl.pathname = '/app'
    appUrl.search = ''
    return NextResponse.redirect(appUrl)
  }

  // ─── /login は Vercel CDN にキャッシュさせない ───────────────
  if (pathname === '/login') {
    res.headers.set('CDN-Cache-Control', 'no-store')
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  return res
}

// ─── middleware を適用するパスのパターン ──────────────────────
export const config = {
  matcher: [
    // /app/* と /login のみに適用
    // _next/static, _next/image, favicon.ico は除外
    '/app/:path*',
    '/login',
  ],
}
