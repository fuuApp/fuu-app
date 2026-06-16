'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ─── プラン定義 ─────────────────────────────────────────────────
const PLANS = [
  {
    id: 'standard',
    name: 'スタンダード',
    price: 980,
    color: 'linear-gradient(135deg,#E91E63,#F48FB1)',
    badge: null,
    features: [
      'あおい・さくら・りかと話し放題',
      '愚痴のお片付け機能',
      'ニックネームで呼んでもらえる',
      'メッセージ保存（直近30日）',
    ],
    notIncluded: [
      'プレミアムキャラ（なつこ・けんじ・ひろし）',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    price: 1480,
    color: 'linear-gradient(135deg,#C2185B,#880E4F)',
    badge: 'おすすめ',
    features: [
      'すべてのキャラと話し放題',
      '愚痴のお片付け機能',
      'ニックネームで呼んでもらえる',
      'メッセージ保存（無制限）',
      'プレミアムキャラ（なつこ・けんじ・ひろし）',
      '優先サポート',
    ],
    notIncluded: [],
  },
]

// Supabase設定チェック
const isSupabaseConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

// ─── メインコンポーネント ────────────────────────────────────────
function PlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('trial') // trial / standard / premium
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 決済完了・キャンセルの通知処理
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setToastMessage({ type: 'success', text: '🎉 ご登録ありがとうございます！プランが有効になりました。' })
      // URLからパラメータを消す
      router.replace('/app/plans')
    } else if (canceled === 'true') {
      setToastMessage({ type: 'error', text: '決済をキャンセルしました。いつでも再開できます。' })
      router.replace('/app/plans')
    }
  }, [searchParams, router])

  // トースト自動消去
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // サブスクリプション開始ハンドラ
  const handleSubscribe = async (planId: string) => {
    if (!isSupabaseConfigured) {
      // デモモード：Stripe未設定を案内
      setToastMessage({
        type: 'error',
        text: '⚙️ デモモード：Stripe設定後に決済が使えます（STRIPE_SETUP.md を参照）',
      })
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

      if (!res.ok) {
        throw new Error(data.error ?? '決済の準備に失敗しました')
      }

      if (data.url) {
        window.location.href = data.url // Stripe Checkout へリダイレクト
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message ?? 'エラーが発生しました' })
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100dvh' }}>

      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/app/settings')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E63', padding: 4 }}
        >‹</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>プランを選ぶ</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* トースト通知 */}
        {toastMessage && (
          <div style={{
            background: toastMessage.type === 'success' ? '#E8F5E9' : '#FFF3E0',
            border: `1px solid ${toastMessage.type === 'success' ? '#A5D6A7' : '#FFB74D'}`,
            borderRadius: 12, padding: '12px 16px',
            fontSize: 13,
            color: toastMessage.type === 'success' ? '#2E7D32' : '#E65100',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            {toastMessage.text}
          </div>
        )}

        {/* 現在のプラン表示 */}
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

        {/* キャッチコピー */}
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: '4px 0 8px', lineHeight: 1.7 }}>
          トライアル終了後も、ふぅと続けよう。<br />
          いつでも解約できます。
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
              {/* おすすめバッジ */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {plan.badge}
                </div>
              )}

              {/* プランヘッダー */}
              <div style={{
                background: plan.color, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
                    ¥{plan.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>/月（税込）</span>
                </div>
              </div>

              {/* 機能リスト */}
              <div style={{ padding: '16px 20px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    marginBottom: 8, fontSize: 13, color: '#444',
                  }}>
                    <span style={{ color: '#E91E63', flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    marginBottom: 8, fontSize: 13, color: '#bbb',
                  }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* ボタン */}
              <div style={{ padding: '0 20px 20px' }}>
                {isCurrentPlan ? (
                  <div style={{
                    textAlign: 'center', padding: '12px',
                    background: '#f5f5f5', borderRadius: 50,
                    fontSize: 13, color: '#aaa',
                  }}>
                    現在のプラン
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    style={{
                      width: '100%', padding: '14px',
                      background: isLoading ? '#F8BBD9'
                        : plan.id === 'premium'
                        ? 'linear-gradient(135deg,#C2185B,#880E4F)'
                        : 'linear-gradient(135deg,#E91E63,#F48FB1)',
                      color: '#fff', border: 'none', borderRadius: 50,
                      fontSize: 15, fontWeight: 700,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    {isLoading ? '準備中...' : `${plan.name}にする →`}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* 注意書き */}
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.9, marginTop: 4 }}>
          <p style={{ margin: 0 }}>
            ・お支払いはクレジットカードのみ（Stripe決済）<br />
            ・月初に自動更新、いつでもキャンセル可能<br />
            ・解約後もその月末まで利用できます
          </p>
        </div>

        {/* デモモード案内 */}
        {!isSupabaseConfigured && (
          <div style={{
            background: '#FFF8E1', border: '1px solid #FFD54F',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 12, color: '#F57F17', textAlign: 'center', lineHeight: 1.7,
          }}>
            ⚙️ デモモード：Stripe設定後に実際の決済が使えます。<br />
            <strong>STRIPE_SETUP.md</strong> を参照してください。
          </div>
        )}
      </div>
    </div>
  )
}

// Suspense ラッパー（useSearchParams に必要）
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
