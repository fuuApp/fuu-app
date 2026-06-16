'use client'

/**
 * Supabase マジックリンク コールバックページ（クライアントサイド）
 *
 * implicit flow: Supabase がハッシュフラグメントにトークンを付与して
 * このページにリダイレクトする。
 * サーバー側では hash を読めないため、クライアントコンポーネントで処理する。
 */

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/app'

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()

        // onAuthStateChange で SIGNED_IN イベントを待つ
        // （implicit flow では getSession() より確実）
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
              subscription.unsubscribe()

              // プロフィール upsert（初回ログイン時のみ実質 insert）
              try {
                await supabase.from('profiles').upsert(
                  {
                    user_id: session.user.id,
                    email: session.user.email ?? '',
                    plan: 'trial',
                    trial_started_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id', ignoreDuplicates: true }
                )
              } catch (e) {
                console.error('[auth/callback] profile upsert failed:', e)
              }

              router.replace(next)
            }
          }
        )

        // フォールバック：既にセッションがある場合
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          subscription.unsubscribe()
          router.replace(next)
          return
        }

        // 5秒後にセッションが取れなければエラー
        setTimeout(async () => {
          subscription.unsubscribe()
          const { data: { session: sess } } = await supabase.auth.getSession()
          if (!sess) {
            console.error('[auth/callback] timeout: no session')
            router.replace('/login?error=auth_failed')
          }
        }, 5000)

      } catch (err) {
        console.error('[auth/callback] error:', err)
        router.replace('/login?error=auth_failed')
      }
    }

    handleAuth()
  }, [router, next])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100dvh',
      background: '#fdf4f7',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌸</div>
      <p style={{ color: '#E91E63', fontSize: 16, fontWeight: 700, margin: 0 }}>
        ログイン中...
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100dvh', background: '#fdf4f7',
      }}>
        <p style={{ color: '#E91E63', fontSize: 16 }}>🌸 ログイン中...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
