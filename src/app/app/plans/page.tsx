'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ─── プラン定義（仕様書v7準拠）────────────────────────────────────
const PLANS = [
  {
    id: 'standard',
    name: 'スタンダード',
    price: 100,
    unit: '/月（税込）',
    color: 'linear-gradient(135deg,#E91E63,#F48FB1)',
    badge: null,
    features: [
      'あおい・さくら・りか・なつこ・けんじと話し放題',
      'BGM自動再生',
      'ニックネームで呼んでもらえる',
      '朝・夜のプッシュ通知（時間は自分で設定）',
      'メッセージ保存（直近7日）',
    ],
    notIncluded: [
      '音声通話（プレミアム限定）',
      'パパキャラ解禁後の追加キャラ',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    price: 980,
    unit: '/月（税込）',
    color: 'linear-gradient(135deg,#C2185B,#880E4F)',
    badge: 'おすすめ',
    features: [
      'すべてのキャラと話し放題',
      'BGM自動再生',
      'ニックネームで呼んでもらえる',
      '朝・夜のプッシュ通知（時間は自分で設定）',
      '【音声通話】月30分（AIリアルタイム音声）',
      '愚痴のお片付け機能',
      'メッセージ保存（30日）',
      '優先サポート',
    ],
    notIncluded: [],
  },
]

const isSupabaseConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

function PlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [currentPlan] = useState<string>('trial')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    if (success === 'true') {
      setToast({ type: 'success', text: '🎉 ご登録ありがとうございます！プランが有効になりました。' })
      router.replace('/app/plans')
    } else if (canceled === 'true') {
      setToast({ type: 'error', text: '決済をキャンセルしました。いつでも再開できます。' })
      router.replace('/app/plans')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t) }
  }, [toast])

  const handleSubscribe = async (planId: string) => {
    if (!isSupabaseConfigured) {
      setToast({ type: 'error', text: '⚙️ デモモード：Stripe設定後に決済が使えます' })
      return
    }
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/subscription/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '決済の準備に失敗しました')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setToast({ type: 'error', text: err.message ?? 'エラーが発生しました' })
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleTicket = () => {
    if (!isSupabaseConfigured) {
      setToast({ type: 'error', text: '⚙️ デモモード：Stripe設定後にチケット購入が使えます' })
      return
    }
    // チケット購入（Stripe one-time payment）
    window.open('https://buy.stripe.com/ticket', '_blank')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100dvh' }}>

      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/app/settings')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E63', padding: 4 }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>プランを選ぶ</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* トースト */}
        {toast && (
          <div style={{
            background: toast.type === 'success' ? '#E8F5E9' : '#FFF3E0',
            border: `1px solid ${toast.type === 'success' ? '#A5D6A7' : '#FFB74D'}`,
            borderRadius: 12, padding: '12px 16px', fontSize: 13,
            color: toast.type === 'success' ? '#2E7D32' : '#E65100',
            textAlign: 'center', lineHeight: 1.6,
          }}>{toast.text}</div>
        )}

        {/* 現在のプラン */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>現在のプラン</div>
            <div style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>
              {currentPlan === 'trial' ? '無料トライアル中（10日間）'
                : currentPlan === 'standard' ? 'スタンダード'
                : 'プレミアム'}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: '4px 0 8px', lineHeight: 1.7 }}>
          トライアル終了後も、ふぅと続けよう。<br />いつでも解約できます。
        </p>

        {/* プランカード */}
        {PLANS.map(plan => {
          const isCurrentPlan = currentPlan === plan.id
          const isLoading = loadingPlan === plan.id
          return (
            <div key={plan.id} style={{
              background: '#fff', borderRadius: 20,
              border: plan.id === 'premium' ? '2px solid #E91E63' : '1.5px solid #FCE4EC',
              overflow: 'hidden',
              boxShadow: plan.id === 'premium'
                ? '0 4px 20px rgba(233,30,99,0.15)'
                : '0 2px 10px rgba(233,30,99,0.07)',
              position: 'relative',
            }}>
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>{plan.badge}</div>
              )}
              <div style={{ background: plan.color, padding: '18px 20px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>¥{plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{plan.unit}</span>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: '#444' }}>
                    <span style={{ color: '#E91E63', flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: '#bbb' }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                {isCurrentPlan ? (
                  <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 50, fontSize: 13, color: '#aaa' }}>
                    現在のプラン
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    style={{
                      width: '100%', padding: 14,
                      background: isLoading ? '#F8BBD9'
                        : plan.id === 'premium'
                        ? 'linear-gradient(135deg,#C2185B,#880E4F)'
                        : 'linear-gradient(135deg,#E91E63,#F48FB1)',
                      color: '#fff', border: 'none', borderRadius: 50,
                      fontSize: 15, fontWeight: 700,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isLoading ? '準備中...' : `${plan.name}にする →`}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* ─── チケットカード ─── */}
        <div style={{
          background: 'linear-gradient(135deg,#FFF9C4,#FFF176)',
          borderRadius: 20, border: '2px solid #FFD54F',
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(255,213,79,0.3)',
        }}>
          <div style={{ background: 'linear-gradient(135deg,#F9A825,#F57F17)', padding: '18px 20px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>🎫 チケット</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>¥300</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>/枚（税込）</span>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F57F17', marginBottom: 10, letterSpacing: '0.05em' }}>
              プレミアム1日券 — 今日だけ全機能使い放題
            </div>
            {[
              'その日のプレミアム機能すべて利用可能',
              '音声通話（当日30分まで）',
              '愚痴のお片付け機能',
              '有効期限：購入翌日24:00まで',
              'スポット利用・継続不要',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: '#555' }}>
                <span style={{ color: '#F9A825', flexShrink: 0, marginTop: 1 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
            <div style={{
              background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 10,
              padding: '8px 12px', fontSize: 11, color: '#F57F17', marginTop: 6, lineHeight: 1.7,
            }}>
              ⚠️ チケットはアプリ内ではなく公式サイト（Stripe）で購入します（Apple課金ルール対応）<br />
              返金は購入後24時間以内・未使用の場合のみ対応
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button
              onClick={handleTicket}
              style={{
                width: '100%', padding: 14,
                background: 'linear-gradient(135deg,#F9A825,#F57F17)',
                color: '#fff', border: 'none', borderRadius: 50,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              チケットを購入する →
            </button>
          </div>
        </div>

        {/* 注意書き */}
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.9, marginTop: 4 }}>
          <p style={{ margin: 0 }}>
            ・お支払いはクレジットカードのみ（Stripe決済）<br />
            ・月額プランは月初に自動更新、いつでもキャンセル可能<br />
            ・解約後もその月末まで利用できます
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div style={{
            background: '#FFF8E1', border: '1px solid #FFD54F',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 12, color: '#F57F17', textAlign: 'center', lineHeight: 1.7,
          }}>
            ⚙️ デモモード：Stripe設定後に実際の決済が使えます。
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', background: '#fdf4f7' }}>
        <div style={{ fontSize: 14, color: '#E91E63' }}>読み込み中...</div>
      </div>
    }>
      <PlansContent />
    </Suspense>
  )
}
