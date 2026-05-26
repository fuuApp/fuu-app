import { createBrowserClient } from '@supabase/ssr'

// ─── ブラウザ側クライアント ───────────────────────────────────
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // implicit flow: トークンをハッシュフラグメントで受け取る
        // → メールリンクをどのブラウザで開いてもログインできる
        flowType: 'implicit',
      },
    }
  )
