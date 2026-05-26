'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Supabase Auth 実装
    setTimeout(() => {
      setSent(true)
      setLoading(false)
    }, 1000)
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#fdf4f7', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E91E63', margin: 0 }}>fuu ふぅ</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>AIのママ友が待っています</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(233,30,99,0.1)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>メールを送りました</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
              <strong>{email}</strong> に<br />ログインリンクを送りました。<br />メールを確認してください。
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
              無料で始める・ログイン
            </h2>
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1.5px solid #F48FB1', fontSize: 15, outline: 'none',
                  background: '#fdf4f7', marginBottom: 20, boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '16px',
                  background: loading ? '#F48FB1' : 'linear-gradient(135deg,#E91E63,#C2185B)',
                  color: '#fff', border: 'none', borderRadius: 50,
                  fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '送信中...' : 'メールでログイン →'}
              </button>
            </form>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16 }}>
              ログインすると<Link href="/terms" style={{ color: '#E91E63' }}>利用規約</Link>と
              <Link href="/privacy" style={{ color: '#E91E63' }}>プライバシーポリシー</Link>に同意したことになります
            </p>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none' }}>← トップページに戻る</Link>
      </div>
    </main>
  )
}
