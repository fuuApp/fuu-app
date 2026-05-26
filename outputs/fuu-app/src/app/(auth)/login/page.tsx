'use client'

import { useState } from 'react'
import Link from 'next/link'

// Supabaseが設定されているかを安全にチェック
const isSupabaseConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      if (isSupabaseConfigured) {
        // Supabase マジックリンク送信
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          },
        })
        if (authError) throw authError
      } else {
        // Supabase未設定時はデモ動作
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100dvh',
      background: '#fdf4f7', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '24px',
    }}>
      {/* ロゴ */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#E91E63', margin: 0 }}>fuu ふぅ</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>AIのママ友が、いつでもそばに</p>
      </div>

      {/* カード */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(233,30,99,0.1)',
      }}>
        {sent ? (
          /* 送信完了 */
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              メールを確認してください
            </h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.9, margin: 0 }}>
              <strong style={{ color: '#E91E63' }}>{email}</strong> に<br />
              ログインリンクを送りました。<br />
              メールのリンクをタップすると<br />
              そのまま入れます。
            </p>
            {!isSupabaseConfigured && (
              <div style={{
                marginTop: 20, background: '#FFF8E1', border: '1px solid #FFD54F',
                borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#F57F17',
              }}>
                ⚙️ デモモード：Supabase設定後に実際のメールが届きます
              </div>
            )}
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{
                marginTop: 20, background: 'none', border: '1px solid #F48FB1',
                borderRadius: 20, padding: '8px 20px', fontSize: 13,
                color: '#E91E63', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              別のメールで試す
            </button>
          </div>
        ) : (
          /* ログインフォーム */
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#333', marginBottom: 6, textAlign: 'center' }}>
              無料で始める・ログイン
            </h2>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 22 }}>
              メールアドレスだけでOK。パスワード不要。
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                required
                autoComplete="email"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: error ? '1.5px solid #E91E63' : '1.5px solid #F48FB1',
                  fontSize: 15, outline: 'none',
                  background: '#fdf4f7', marginBottom: 4,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />

              {error && (
                <p style={{ fontSize: 12, color: '#E91E63', marginBottom: 8, marginTop: 4 }}>
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%', padding: '16px',
                  background: loading || !email.trim()
                    ? '#F8BBD9'
                    : 'linear-gradient(135deg,#E91E63,#C2185B)',
                  color: '#fff', border: 'none', borderRadius: 50,
                  fontSize: 16, fontWeight: 700,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  marginTop: 12, transition: 'background 0.2s', fontFamily: 'inherit',
                }}
              >
                {loading ? '送信中...' : 'ログインリンクを送る →'}
              </button>
            </form>

            {/* デモ直接入場ボタン（Supabase未設定時のみ表示） */}
            {!isSupabaseConfigured && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#f0e0e6' }} />
                  <span style={{ fontSize: 11, color: '#ccc', whiteSpace: 'nowrap' }}>開発・テスト用</span>
                  <div style={{ flex: 1, height: 1, background: '#f0e0e6' }} />
                </div>
                <Link href="/app" style={{
                  display: 'inline-block',
                  background: '#FCE4EC', color: '#E91E63',
                  padding: '10px 24px', borderRadius: 50,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  border: '1px solid #F48FB1',
                }}>
                  🛠️ デモとして入る（認証スキップ）
                </Link>
              </div>
            )}

            <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 20, lineHeight: 1.8 }}>
              ログインすると
              <Link href="/terms" style={{ color: '#E91E63', textDecoration: 'none' }}>利用規約</Link>と
              <Link href="/privacy" style={{ color: '#E91E63', textDecoration: 'none' }}>プライバシーポリシー</Link>に
              同意したことになります
            </p>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: '#bbb', textDecoration: 'none' }}>
          ← トップページに戻る
        </Link>
      </div>
    </main>
  )
}
