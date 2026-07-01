import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!isSupabaseConfigured) {
    return NextResponse.next()
  }

  let res = NextResponse.next({
    request: { headers: req.headers },
  })

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

  // getUser() はSupabaseサーバーに都度確認するため、削除済みユーザーを正しく弾く
  // （getSession() はJWTキャッシュを参照するため退会後もアクセス可能になるバグが発生する）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // /app/* へのアクセス保護
  if (pathname.startsWith('/app')) {
    if (!user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/signin'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ログイン済みユーザーが /signin にアクセスした場合
  if (pathname === '/signin' && user) {
    const appUrl = req.nextUrl.clone()
    appUrl.pathname = '/app'
    appUrl.search = ''
    return NextResponse.redirect(appUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/app/:path*',
    '/signin',
  ],
}
