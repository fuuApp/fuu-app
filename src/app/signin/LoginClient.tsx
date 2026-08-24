'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const isSupabaseConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

// Capacitor native iOS 判定（SSR時はfalse）
const getIsNativeIOS = () => {
  if (typeof window === 'undefined') return false
  try {
    const cap = (window as any).Capacitor
    if (cap?.isNativePlatform?.()) return cap.getPlatform?.() === 'ios'
    const { Capacitor } = require('@capacitor/core')
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
  } catch { return false }
}

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
  const [isNativeIOS, setIsNativeIOS] = useState(false)
  const [error, setError]   = useState(
    authErrorParam === 'auth_failed'   ? '認証に失敗しました。もう一度お試しください。'
    : authErrorParam === 'missing_code' ? 'リンクが無効です。再度ログインしてください。'
    : ''
  )

  useEffect(() => {
    setIsNativeIOS(getIsNativeIOS())
  }, [])

  const handleAppleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
      const result = await SignInWithApple.authorize({
        clientId: 'com.ogawave.fuu',
        redirectURI: '',
        scopes: 'email name',
        state: '',
        nonce: '',
      })
      const identityToken = result.response.identityToken
      if (!identityToken) throw new Error('Apple sign in failed')

      if (isSupabaseConfigured) {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data, error: authErr } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: identityToken,
        })
        if (authErr) throw authErr
        if (data.session) {
          const now = new Date().toISOString()
          await supabase.from('profiles').upsert(
            { user_id: data.session.user.id, email: data.session.user.email ?? '', plan: 'trial', trial_started_at: now },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
        }
      }
      router.replace(nextPath)
    } catch (err: any) {
      if (err?.code === 'SIGN_IN_WITH_APPLE_CANCELLED') { setLoading(false); return }
      setError('Appleサインインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

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
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#F48FB1' }} />
              <span style={{ margin: '0 12px', fontSize: 12, color: '#bbb' }}>または</span>
              <div style={{ flex: 1, height: 1, background: '#F48FB1' }} />
            </div>
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={loading}
              style={{ width: '100%', padding: '14px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
            >
              <svg width="18" height="22" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.9 46.4 42.7 0 109.2-49.4 188.2-49.4 30.7 0 112.6 2.9 173.4 80.1zm-174.5-186.6c31.6-37.7 54.2-90.2 54.2-142.7 0-7.4-.7-14.9-2.1-21a437.1 437.1 0 0 0-106.6 53.4 285.1 285.1 0 0 0-84.2 133.3c0 8.4 1.4 16.8 2.1 19.6 4.2.7 11.2 1.4 18.2 1.4 31.6 0 73.6-16.9 118.4-43.9z"/></svg>
              Appleでサインイン
            </button>
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
