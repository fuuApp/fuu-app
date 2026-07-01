'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const isSupabaseConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

// props を削除し useSearchParams で直接読む（Capacitor静的ビルド対応）
export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/app'
  const authErrorParam = searchParams.get('error') ?? ''

  const [email, setEmail]   = useState('')
  const [otp, setOtp]       = useState('')
  const [step, setStep]     = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(
    authErrorParam === 'auth_failed'   ? '認証に失敗しました。もう一度お試しください。'
    : authErrorParam === 'missing_code' ? 'リンクが無効です。再度ログインしてください。'
    : ''
  )

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      if (isSupabaseConfigured) {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { error: authErr } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        })
        if (authErr) throw authErr
      } else {
        await new Promise(r => setTimeout(r, 800))
      }
      setStep('otp')
    } catch (err: any) {
      setError(err.message ?? 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)
    setError('')
    try {
      if (isSupabaseConfigured) {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp.trim(),
          type: 'email',
        })
        if (verifyErr) throw verifyErr
        if (data.session) {
          try {
            const now = new Date().toISOString()
            // 新規ユーザー: trialとして挿入（既存ユーザーはスキップ）
            await supabase.from('profiles').upsert(
              { user_id: data.session.user.id, email: data.session.user.email ?? '', plan: 'trial', trial_started_at: now },
              { onConflict: 'user_id', ignoreDuplicates: true }
            )
            // Supabaseトリガーで作成されたプロフィール（trial_started_at=null）を補完
            // トリガーはデフォルト値でINSERTするため trial_started_at が未設定になる場合がある
            await supabase
              .from('profiles')
              .update({ trial_started_at: now, plan: 'trial' })
              .eq('user_id', data.session.user.id)
              .is('trial_started_at', null)
              .in('plan', ['free', 'trial'])
          } catch (profileErr) {
            console.error('[login] profile upsert failed:', profileErr)
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 800))
      }
      router.replace(nextPath)
    } catch (err: any) {
      const msg = err.message ?? ''
      if (msg.includes('expired') || msg.includes('invalid')) {
        setError('コードが無効または期限切れです。もう一度メールを送ってください。')
      } else {
        setError(msg || '認証に失敗しました。もう一度お試しください。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#fdf4f7', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img src="/icons/icon_c.png" alt="fuu" style={{ width: 96, height: 96, borderRadius: 22, marginBottom: 8, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#E91E63', margin: 0 }}>fuu ふぅ</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>AIのママ友が、いつでもそばに</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 24px rgba(233,30,99,0.1)' }}>
        {step === 'email' ? (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#333', marginBottom: 6, textAlign: 'center' }}>
              無料で始める・ログイン
            </h2>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 22 }}>
              メールアドレスだけでOK。パスワード不要。
            </p>
            <form onSubmit={handleSendOtp}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>メールアドレス</label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com" required autoComplete="email"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: error ? '1.5px solid #E91E63' : '1.5px solid #F48FB1', fontSize: 15, outline: 'none', background: '#fdf4f7', marginBottom: 4, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              {error && <p style={{ fontSize: 12, color: '#E91E63', marginBottom: 8, marginTop: 4 }}>⚠️ {error}</p>}
              <button type="submit" disabled={loading || !email.trim()}
                style={{ width: '100%', padding: '16px', background: loading || !email.trim() ? '#F8BBD9' : 'linear-gradient(135deg,#E91E63,#C2185B)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 700, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer', marginTop: 12, fontFamily: 'inherit' }}>
                {loading ? '送信中...' : 'コードを送る →'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 20, lineHeight: 1.8 }}>
              ログインすると<Link href="/terms" style={{ color: '#E91E63', textDecoration: 'none' }}>利用規約</Link>と<Link href="/privacy" style={{ color: '#E91E63', textDecoration: 'none' }}>プライバシーポリシー</Link>に同意したことになります
            </p>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📧</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#333', marginBottom: 6 }}>コードを入力してください</h2>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.8, margin: 0 }}>
                <strong style={{ color: '#E91E63' }}>{email}</strong> に<br />コードを送りました。
              </p>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000" autoFocus
                style={{ width: '100%', padding: '18px 16px', borderRadius: 14, border: error ? '1.5px solid #E91E63' : '1.5px solid #F48FB1', fontSize: 28, fontWeight: 700, letterSpacing: 10, textAlign: 'center', outline: 'none', background: '#fdf4f7', marginBottom: 4, boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
              {error && <p style={{ fontSize: 12, color: '#E91E63', marginBottom: 8, marginTop: 4 }}>⚠️ {error}</p>}
              <button type="submit" disabled={loading || otp.length < 6}
                style={{ width: '100%', padding: '16px', background: loading || otp.length < 6 ? '#F8BBD9' : 'linear-gradient(135deg,#E91E63,#C2185B)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 700, cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer', marginTop: 12, fontFamily: 'inherit' }}>
                {loading ? '確認中...' : 'ログイン →'}
              </button>
            </form>
            <button onClick={() => { setStep('email'); setOtp(''); setError('') }}
              style={{ width: '100%', marginTop: 12, background: 'none', border: '1px solid #F48FB1', borderRadius: 50, padding: '12px', fontSize: 13, color: '#E91E63', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← メールアドレスを変更する
            </button>
            <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16 }}>
              コードが届かない場合は迷惑メールフォルダを確認してください
            </p>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: '#bbb', textDecoration: 'none' }}>← トップページに戻る</Link>
      </div>
    </main>
  )
}
