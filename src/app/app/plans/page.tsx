'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { isNative, openStripeCheckout } from '@/lib/platform'
import { createClient } from '@/lib/supabase'

// ─── プラン定義 ─────────────────────────────────────────────────
// 無料トライアル：10日間・70通・あおい・さくらのみ
// スタンダード  ：¥300/月・200通・あおい〜なつこ（4名）・¥300チケット可
// プレミアム    ：¥980/月・900通・全キャラ＋専用3名・STT・¥300チケット可
const PLANS = [
  {
    id: 'standard',
    name: 'スタンダード',
    price: 300,
    color: 'linear-gradient(135deg,#E91E63,#F48FB1)',
    badge: null,
    subtitle: '月200会話まで',
    features: [
      'あおい・さくら・りか・なつこ（4名）と話せる',
      'ニックネームで呼んでもらえる',
      '気持ちの箱（感情整理）',
      'BGMフル利用',
      '朝・夜プッシュ通知',
      '使い放題チケット ¥300/日（追加購入可）',
    ],
    notIncluded: [
      'プレミアム専用キャラ（けんじ・ひろし・随時追加）',
      '音声テキスト入力',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    price: 980,
    color: 'linear-gradient(135deg,#C2185B,#880E4F)',
    badge: 'おすすめ',
    subtitle: '月900会話まで',
    features: [
      '全キャラ＋プレミアム専用キャラと話せる',
      'プレミアム専用キャラ（けんじ・ひろし・随時追加）',
      'ニックネームで呼んでもらえる',
      '気持ちの箱（感情整理）',
      'BGMフル利用',
      '朝・夜プッシュ通知',
      '🎤 音声テキスト入力（話すだけで文字起こし）',
      '使い放題チケット ¥300/日（追加購入可）',
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
  const [loadingTicket, setLoadingTicket] = useState(false)
  const [loadingActivate, setLoadingActivate] = useState(false)
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>('trial') // trial / standard / premium
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ticketActiveUntil, setTicketActiveUntil] = useState<string | null>(null)
  const [availableTickets, setAvailableTickets] = useState(0)
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isTicketJustPurchased, setIsTicketJustPurchased] = useState(false)

  // ── プラン・チケット状態をSupabaseから取得する共通関数 ──────────────
  // 初回マウント時 + ネイティブアプリでSafari/Chrome決済後にアプリ復帰した際の
  // 両方で呼ぶ。ユーザーIDは引数 or state から取る。
  const fetchPlanStatus = async (uid?: string) => {
    try {
      const supabase = createClient()
      const resolvedUid = uid ?? userId
      if (!resolvedUid) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, ticket_active_until')
        .eq('user_id', resolvedUid)
        .single()
      if (profile?.plan) setCurrentPlan(profile.plan === 'free' ? 'trial' : profile.plan)
      setTicketActiveUntil(profile?.ticket_active_until ?? null)

      const now = new Date().toISOString()
      const { data: tickets } = await supabase
        .from('tickets')
        .select('quantity, used')
        .eq('user_id', resolvedUid)
        .gt('expires_at', now)
      const remaining = tickets?.reduce((sum, t) => sum + (t.quantity - t.used), 0) ?? 0
      setAvailableTickets(remaining)
    } catch { /* 取得失敗時はそのまま */ }
  }

  // Supabaseから現在のプランとチケット状態を取得（初回）
  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setUserEmail(user.email ?? '')
          await fetchPlanStatus(user.id)
        }
      } catch { /* 取得失敗時はtrialのまま */ }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── ネイティブアプリ: Safari/Chrome 決済後にアプリへ戻った際にプランを再取得 ──
  // iOS: Safari で Stripe 決済完了 → ユーザーがアプリに戻る → appStateChange(isActive=true)
  // Android: Chrome で Stripe 決済完了 → ユーザーがアプリに戻る → appStateChange(isActive=true)
  // Web: success_url のクエリパラメータ（?success=true）で処理するため不要
  useEffect(() => {
    if (!isNative()) return

    let removeListener: (() => void) | undefined

    ;(async () => {
      const { App } = await import('@capacitor/app')
      const handle = await App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          // アプリがフォアグラウンドに戻ったらプラン状態を再取得
          fetchPlanStatus()
        }
      })
      removeListener = () => handle.remove()
    })()

    return () => { removeListener?.() }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 決済完了・キャンセルの通知処理
  useEffect(() => {
    const success = searchParams.get('success')
    const ticketSuccess = searchParams.get('ticket_success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setToastMessage({ type: 'success', text: '🎉 ご登録ありがとうございます！プランが有効になりました。' })
      router.replace('/app/plans')
    } else if (ticketSuccess === 'true') {
      router.replace('/app/plans')
      setIsTicketJustPurchased(true)
      setToastMessage({ type: 'success', text: '🎫 チケットを購入しました！' })
      // webhookの処理を待ちながらactivate-ticketをリトライ（最大4回、間隔を広げながら）
      const tryActivate = async () => {
        const delays = [5000, 8000, 12000, 15000]
        for (const delay of delays) {
          await new Promise(r => setTimeout(r, delay))
          try {
            const res = await fetch('/api/subscription/activate-ticket', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
              setTicketActiveUntil(data.activeUntil)
              setAvailableTickets(0)
              setIsTicketJustPurchased(false)
              setToastMessage({ type: 'success', text: '🎫 チケットを有効化しました！24時間使い放題です。' })
              return
            }
          } catch { /* リトライ続行 */ }
        }
        // 全リトライ失敗：UIを更新してユーザーに手動有効化を促す
        await fetchPlanStatus()
        setIsTicketJustPurchased(false)
      }
      tryActivate()
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

  // チケット購入ハンドラ
  const handleTicket = async () => {
    setLoadingTicket(true)
    try {
      const res = await fetch('/api/subscription/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'チケット購入の準備に失敗しました')
      if (data.url) await openStripeCheckout(data.url)
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message ?? 'エラーが発生しました' })
    } finally {
      setLoadingTicket(false)
    }
  }

  // チケット有効化ハンドラ（購入済みチケットを24時間有効にする）
  const handleActivateTicket = async () => {
    setLoadingActivate(true)
    try {
      const res = await fetch('/api/subscription/activate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'チケットの有効化に失敗しました')
      setTicketActiveUntil(data.activeUntil)
      setAvailableTickets(prev => Math.max(0, prev - 1))
      setToastMessage({ type: 'success', text: '🎫 チケットを有効化しました！24時間使い放題です。' })
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message ?? 'エラーが発生しました' })
    } finally {
      setLoadingActivate(false)
    }
  }

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
        body: JSON.stringify({ plan: planId, userId, email: userEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? '決済の準備に失敗しました')
      }

      if (data.url) {
        // iOS/Android ネイティブ: Browser.open() で Safari/Chrome（外部ブラウザ）を起動
        // Web: 同タブ遷移（通常の Stripe Checkout）
        await openStripeCheckout(data.url)
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message ?? 'エラーが発生しました' })
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <>
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

        {/* ネイティブアプリ向け：外部ブラウザで決済する旨の案内 */}
        {isNative() && (
          <div style={{
            background: '#E3F2FD', border: '1px solid #90CAF9',
            borderRadius: 14, padding: '12px 16px', lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1565C0', marginBottom: 2 }}>
              📱 アプリからのご登録について
            </div>
            <div style={{ fontSize: 12, color: '#1565C0' }}>
              下のボタンをタップするとブラウザ（Safari / Chrome）が開き、
              そこでお支払い手続きができます。完了後アプリに戻るとプランが反映されます。
            </div>
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
                : currentPlan === 'premium' ? 'プレミアム'
                : currentPlan === 'canceled' ? '解約済み（プラン終了）'
                : '無料トライアル中（10日間）'}
            </div>
          </div>
        </div>

        {/* トライアル説明 */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
          border: '1.5px dashed #FCE4EC',
        }}>
          <div style={{ fontSize: 12, color: '#E91E63', fontWeight: 700, marginBottom: 6 }}>🎁 無料トライアル（10日間）でできること</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            ・あおい・さくらと70会話まで無料でお話できます<br />
            ・BGMフル利用（全曲試聴・チャット中再生）<br />
            ・トライアル終了後は自動課金されません
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
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
                  {plan.subtitle}
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

        {/* ─── チケット購入カード ─── */}
        {(currentPlan === 'standard' || currentPlan === 'premium') && (
          <div style={{
            background: 'linear-gradient(135deg,#FFF8E1,#FFF3E0)',
            border: '2px solid #FFB300',
            borderRadius: 20, padding: '20px 20px', marginTop: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🎫</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#E65100' }}>使い放題チケット</div>
                <div style={{ fontSize: 12, color: '#F57F17', fontWeight: 600 }}>¥300 / 1日限り</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E65100' }}>¥300</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>税込</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#795548', lineHeight: 1.8, marginBottom: 14 }}>
              購入から24時間、通数制限なし。<br />
              話したい日に、好きなだけ話せる1日券。
            </div>

            {/* チケット有効中バナー OR 購入済みチケット有効化エリア */}
            {ticketActiveUntil && new Date(ticketActiveUntil) > new Date() ? (
              // 有効中：緑バナーのみ表示
              <div style={{
                background: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)',
                border: '1.5px solid #66BB6A',
                borderRadius: 12, padding: '12px 14px',
                marginBottom: 12, fontSize: 12, color: '#2E7D32', lineHeight: 1.7,
              }}>
                ✅ チケット有効中！<br />
                <strong>{new Date(ticketActiveUntil).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> まで使い放題
              </div>
            ) : (availableTickets > 0 || isTicketJustPurchased) ? (
              // 購入済みチケットあり or 購入直後：緑エリアにactivateボタン
              <div style={{
                background: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)',
                border: '1.5px solid #66BB6A',
                borderRadius: 12, padding: '12px 14px',
                marginBottom: 12,
              }}>
                {isTicketJustPurchased && availableTickets === 0 ? (
                  <div style={{ fontSize: 12, color: '#2E7D32', marginBottom: 10, lineHeight: 1.6 }}>
                    🎫 チケットを購入しました！<br />自動有効化を試みています…（最大40秒ほどかかる場合があります）
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#2E7D32', marginBottom: 10 }}>
                    🎫 購入済みチケット {availableTickets}枚 — 今すぐ使えます
                  </div>
                )}
                <button
                  onClick={handleActivateTicket}
                  disabled={loadingActivate || (isTicketJustPurchased && availableTickets === 0)}
                  style={{
                    width: '100%', padding: '13px',
                    background: (loadingActivate || (isTicketJustPurchased && availableTickets === 0))
                      ? '#A5D6A7'
                      : 'linear-gradient(135deg,#43A047,#2E7D32)',
                    color: '#fff', border: 'none', borderRadius: 50,
                    fontSize: 14, fontWeight: 700,
                    cursor: (loadingActivate || (isTicketJustPurchased && availableTickets === 0)) ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {loadingActivate ? '有効化中...'
                    : (isTicketJustPurchased && availableTickets === 0) ? '確認中...'
                    : `今すぐ使う（残${availableTickets}枚）`}
                </button>
              </div>
            ) : null}

            <button
              onClick={handleTicket}
              disabled={loadingTicket}
              style={{
                width: '100%', padding: '13px',
                background: loadingTicket ? '#FFE082' : 'linear-gradient(135deg,#FFB300,#FF6F00)',
                color: '#fff', border: 'none', borderRadius: 50,
                fontSize: 15, fontWeight: 700,
                cursor: loadingTicket ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loadingTicket ? '準備中...' : '今日のチケットを買う →'}
            </button>
          </div>
        )}

        {/* 注意書き */}
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.9, marginTop: 4 }}>
          <p style={{ margin: 0 }}>
            ・お支払いはクレジットカード・Apple Pay・Google Pay（Stripe決済）<br />
            ・毎月同日に自動更新、いつでもキャンセル可能<br />
            ・解約後も次回更新日まで利用できます
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

        {/* 解約ボタン（有料プランのみ表示） */}
        {(currentPlan === 'standard' || currentPlan === 'premium') && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #FCE4EC', textAlign: 'center' }}>
            <button
              onClick={() => setShowCancelConfirm(true)}
              style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              解約する
            </button>
            <div style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>解約後も次回更新日まで利用できます</div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>

    {/* 解約確認モーダル */}
    {showCancelConfirm && (
      <div
        onClick={() => setShowCancelConfirm(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 320, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        >
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.8, marginBottom: 20 }}>
            <strong>解約しますか？</strong><br />
            解約後も次回更新日まで引き続きご利用いただけます。日割り返金はありません。
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowCancelConfirm(false)}
              style={{ flex: 1, background: '#f5f5f5', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, color: '#666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >キャンセル</button>
            <button
              onClick={async () => {
                setLoadingCancel(true)
                try {
                  const res = await fetch('/api/subscription/cancel', { method: 'POST' })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error)
                  setShowCancelConfirm(false)
                  setToastMessage({ type: 'success', text: `解約しました。${data.cancelAt ? data.cancelAt + 'まで' : '次回更新日まで'}ご利用できます。` })
                } catch (e: any) {
                  setToastMessage({ type: 'error', text: e.message ?? '解約処理に失敗しました' })
                } finally {
                  setLoadingCancel(false)
                }
              }}
              disabled={loadingCancel}
              style={{ flex: 1, background: '#f44336', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, opacity: loadingCancel ? 0.6 : 1 }}
            >{loadingCancel ? '処理中...' : '解約する'}</button>
          </div>
        </div>
      </div>
    )}
    </>
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
