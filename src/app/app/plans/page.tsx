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
      '使い放題チケット ¥300/日（追加購入可）',
    ],
    notIncluded: [
      'プレミアム専用キャラ（けんじ・ひろし・随時追加）',
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
  const [currentPlan, setCurrentPlan] = useState<string>('trial') // trial / standard / premium
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ticketActiveUntil, setTicketActiveUntil] = useState<string | null>(null)
  const [availableTickets, setAvailableTickets] = useState(0)
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isTicketJustPurchased, setIsTicketJustPurchased] = useState(false)
  const [scheduledDowngradeAt, setScheduledDowngradeAt] = useState<string | null>(null)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false)
  const [withdrawalDate, setWithdrawalDate] = useState<string | null>(null)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [cancelDate, setCancelDate] = useState<string | null>(null)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [upgradeConfirmPlan, setUpgradeConfirmPlan] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')

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

      // ダウングレード予約情報を取得（Stripe スケジュール確認）
      try {
        const schedRes = await fetch(`/api/subscription/schedule?userId=${resolvedUid}`)
        if (schedRes.ok) {
          const schedData = await schedRes.json()
          setScheduledDowngradeAt(schedData.scheduledDowngradeAt ?? null)
          setPendingWithdrawal(schedData.pendingWithdrawal ?? false)
          setWithdrawalDate(schedData.withdrawalDate ?? null)
          setCancelAtPeriodEnd(schedData.cancelAtPeriodEnd ?? false)
          setCancelDate(schedData.cancelDate ?? null)
        }
      } catch { /* スケジュール取得失敗時は無視 */ }
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
        } else {
          // Safari外部ブラウザ経由: URLパラメータからuserId/emailを取得
          const uidParam = searchParams.get('uid')
          const emailParam = searchParams.get('email')
          if (uidParam) {
            setUserId(uidParam)
            setUserEmail(emailParam ?? '')
            await fetchPlanStatus(uidParam)
          }
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
      setJustSubscribed(true)
      // Webhookが届く前にURLパラメータからプランを即時反映（真っ白ボタン防止）
      const planParam = searchParams.get('plan')
      if (planParam === 'standard' || planParam === 'premium') {
        setCurrentPlan(planParam)
      }
      setToastMessage({ type: 'success', text: '🎉 ご登録ありがとうございます！プランが有効になりました。' })
      router.replace('/app/plans')
      // Webhook反映を待ってSupabaseを再確認（最大2回）
      const pollPlan = async () => {
        await new Promise(r => setTimeout(r, 5000))
        await fetchPlanStatus()
        await new Promise(r => setTimeout(r, 10000))
        await fetchPlanStatus()
      }
      pollPlan()
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
    } else if (searchParams.get('payment_updated') === 'true') {
      // 決済方法変更後にアプリへ戻ってきた → モーダルを自動表示・プロモコード復元
      const upgradeTo = searchParams.get('upgrade_to') ?? 'premium'
      const savedPromo = sessionStorage.getItem('fuu_pending_promo') ?? ''
      sessionStorage.removeItem('fuu_pending_promo')
      router.replace('/app/plans')
      setToastMessage({ type: 'success', text: '✅ 決済方法を更新しました。そのままアップグレードできます。' })
      if (savedPromo) setPromoCode(savedPromo)
      setUpgradeConfirmPlan(upgradeTo)
    }
  }, [searchParams, router])

  // トースト自動消去
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // ── iOSネイティブ：外部ブラウザでプランページを開く（Strategy C）──
  // Strategy C: /app/plans 直接リンク → Apple審査で問題があれば Strategy B（/app）に変更
  // 変更箇所：この関数の url を 'https://fuu-app.vercel.app/app' に変えるだけで B に切替可
  const handleOpenWebPlans = async () => {
    // userId/emailをURLパラメータで渡す（Safari側でSupabase認証が取れないため）
    const params = new URLSearchParams()
    if (userId) params.set('uid', userId)
    if (userEmail) params.set('email', userEmail)
    const query = params.toString() ? `?${params.toString()}` : ''
    const url = `https://fuu-app.vercel.app/app/plans${query}`
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } catch {
      window.open(url, '_blank')
    }
  }

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

  // サブスクリプション開始ハンドラ（実行）
  const handleOpenPaymentMethodPortal = async () => {
    try {
      // 戻ってきたときのためにプロモコードを保存
      if (promoCode) sessionStorage.setItem('fuu_pending_promo', promoCode)
      const targetPlan = upgradeConfirmPlan ?? 'premium'
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail, upgradeTo: targetPlan }),
      })
      const data = await res.json()
      if (data.url) {
        setUpgradeConfirmPlan(null)
        setPromoCode('')
        await openStripeCheckout(data.url)
      }
    } catch (err) {
      console.error('Portal error:', err)
    }
  }

  const executeSubscribe = async (planId: string, code?: string) => {
    if (!isSupabaseConfigured) {
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
        body: JSON.stringify({ plan: planId, userId, email: userEmail, promoCode: code || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? '決済の準備に失敗しました')
      }

      if (data.alreadyOnPlan) {
        setToastMessage({ type: 'success', text: '既にこのプランです。' })
      } else if (data.updated) {
        // アップグレード完了（即時反映）
        setToastMessage({ type: 'success', text: '🎉 プランをアップグレードしました！' })
        await fetchPlanStatus()
      } else if (data.scheduled) {
        // ダウングレード予約完了（期末反映）→ 常時バナーに切り替え
        setScheduledDowngradeAt(data.effectiveDate ?? null)
      } else if (data.url) {
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

  // サブスクリプション開始ハンドラ（確認モーダルを挟む）
  const handleSubscribe = (planId: string) => {
    // 既存の有料プランから変更する場合（アップグレード・ダウングレード）は確認モーダルを表示
    // トライアル/解約済みは Stripe Checkout に直接進む（Stripe 側で確認画面が出る）
    if (currentPlan === 'standard' || currentPlan === 'premium') {
      setUpgradeConfirmPlan(planId)
      return
    }
    executeSubscribe(planId)
  }

  return (
    <>
    {/* プラン変更確認モーダル（既存サブスク持ちユーザーのワンクリック誤課金防止） */}
    {upgradeConfirmPlan && (() => {
      const plan = PLANS.find(p => p.id === upgradeConfirmPlan)
      const isUpgrade = upgradeConfirmPlan === 'premium' && currentPlan === 'standard'
      const isDowngrade = upgradeConfirmPlan === 'standard' && currentPlan === 'premium'
      return (
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
          <div style={{ width:'100%',maxWidth:480,background:'#fff',borderRadius:'20px 20px 0 0',padding:'28px 24px 44px',boxShadow:'0 -4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:28,textAlign:'center',marginBottom:10 }}>💳</div>
            <div style={{ fontWeight:700,fontSize:17,color:'#333',textAlign:'center',marginBottom:8 }}>
              {isUpgrade ? 'プレミアムにアップグレード' : isDowngrade ? 'スタンダードにダウングレード' : 'プラン変更の確認'}
            </div>

            {/* 変更内容サマリー */}
            <div style={{ background:'#FCE4EC',border:'1px solid #F48FB1',borderRadius:14,padding:'14px 16px',marginBottom:14,fontSize:13,color:'#C2185B',lineHeight:1.9,textAlign:'center' }}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:4,whiteSpace:'nowrap' }}>
                {currentPlan === 'premium' ? 'プレミアム（¥980/月）' : 'スタンダード（¥300/月）'}
                {' → '}
                {plan?.name}（¥{plan?.price.toLocaleString()}/月）
              </div>
              {isUpgrade && (
                <div style={{ fontSize:12,color:'#E91E63' }}>
                  今すぐプレミアム機能が使えます。<br />
                  次回更新日から¥{plan?.price.toLocaleString()}/月になります。日割り請求はありません。
                </div>
              )}
              {isDowngrade && (
                <div style={{ fontSize:12,color:'#E91E63' }}>
                  今の期間終了後にスタンダードへ切り替わります。<br />
                  それまでプレミアムを引き続きご利用いただけます。
                </div>
              )}
            </div>

            {isUpgrade && (
              <>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11,color:'#999',marginBottom:4 }}>キャンペーンコード（任意）</div>
                  <input
                    type="text"
                    placeholder="コードを入力"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    style={{ width:'100%',boxSizing:'border-box',padding:'10px 12px',border:'1px solid #ddd',borderRadius:10,fontSize:14,fontFamily:'inherit',outline:'none' }}
                  />
                </div>
                <button
                  onClick={handleOpenPaymentMethodPortal}
                  style={{ width:'100%',background:'none',border:'1px solid #ddd',borderRadius:10,padding:'10px 0',fontSize:13,color:'#666',cursor:'pointer',fontFamily:'inherit',marginBottom:4 }}
                >
                  💳 支払い方法を変更する →
                </button>
                <p style={{ fontSize:13,color:'#e53935',textAlign:'center',margin:'0 0 10px',lineHeight:1.6,fontWeight:600 }}>
                  ⚠️ 変更後は「fuu ふぅに戻る」をタップして<br />アプリに戻ってください
                </p>
              </>
            )}
            <div style={{ display:'flex',gap:10,marginTop:4 }}>
              <button
                onClick={() => { setUpgradeConfirmPlan(null); setPromoCode('') }}
                style={{ flex:1,background:'#f5f5f5',border:'none',borderRadius:14,padding:'14px 0',fontSize:14,color:'#666',cursor:'pointer',fontFamily:'inherit' }}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const planId = upgradeConfirmPlan
                  const code = promoCode.trim() || undefined
                  setUpgradeConfirmPlan(null)
                  setPromoCode('')
                  executeSubscribe(planId, code)
                }}
                style={{ flex:1,background:'linear-gradient(135deg,#C2185B,#880E4F)',border:'none',borderRadius:14,padding:'14px 0',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit',lineHeight:1.4 }}
              >
                {isUpgrade ? <>登録済み支払い方法で<br />アップグレードする</> : isDowngrade ? 'ダウングレードを予約' : '変更する'}
              </button>
            </div>
          </div>
        </div>
      )
    })()}

    <div style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100dvh' }}>

      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 14px)', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => {
            // 決済直後(justSubscribed)はrouter.back()でStripe決済ページに戻らずホームへ
            if (justSubscribed) {
              router.push('/app')
            } else if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/app/settings')
            }
          }}
          style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',padding:'6px 0',fontFamily:'inherit',lineHeight:1 }}
        >
          <span style={{ fontSize:20,color:'#E91E63',lineHeight:1 }}>‹</span>
          <span style={{ fontWeight:700,fontSize:16,color:'#333' }}>
            {justSubscribed ? 'ホームへ' : 'プランを選ぶ'}
          </span>
        </button>
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

        {/* 退会予約バナー（常時表示） */}
        {pendingWithdrawal && (
          <div style={{
            background: '#FFF3E0', border: '1.5px solid #FFB74D',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 13, color: '#E65100',
            textAlign: 'center', lineHeight: 1.9,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🚪 退会を予約しました</div>
            {withdrawalDate ? (
              <>
                <strong style={{ fontSize: 15 }}>
                  {new Date(withdrawalDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                </strong>
                {' '}までは引き続き
                <strong>
                  {currentPlan === 'premium' ? 'プレミアム' : currentPlan === 'standard' ? 'スタンダード' : '現在のプラン'}
                </strong>
                をご利用いただけます。<br />
                <span style={{ fontSize: 12, color: '#F57F17' }}>
                  {new Date(withdrawalDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}にアカウントが自動削除されます。
                </span>
              </>
            ) : (
              '次回更新日まで引き続きご利用いただけます。次回更新日にアカウントが削除されます。'
            )}
          </div>
        )}

        {/* 解約予約バナー：期末まで利用可能（常時表示・アプリ・Web 両方） */}
        {cancelAtPeriodEnd && !pendingWithdrawal && (
          <div style={{
            background: '#E8F5E9', border: '1.5px solid #66BB6A',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 13, color: '#2E7D32',
            textAlign: 'center', lineHeight: 1.9,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>✅ 解約手続きが完了しました</div>
            {cancelDate ? (
              <>
                <strong style={{ fontSize: 15 }}>
                  {new Date(cancelDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                </strong>
                {'まで引き続き'}
                <strong>
                  {currentPlan === 'premium' ? 'プレミアム' : currentPlan === 'standard' ? 'スタンダード' : '現在のプラン'}
                </strong>
                {'をご利用いただけます。'}
              </>
            ) : (
              '次回更新日まで引き続きご利用いただけます。'
            )}
          </div>
        )}

        {/* ダウングレード予約バナー（常時表示） */}
        {scheduledDowngradeAt && !pendingWithdrawal && (
          <div style={{
            background: '#E8F5E9', border: '1px solid #A5D6A7',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 13, color: '#2E7D32',
            textAlign: 'center', lineHeight: 1.7,
          }}>
            📅 <strong>{new Date(scheduledDowngradeAt).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}</strong>からスタンダードプランに切り替わります。それまで引き続きプレミアムをご利用いただけます。
          </div>
        )}

        {/* ── iOSネイティブ：Strategy C（プランページ直接ボタン） ── */}
        {/* 購入はSafari外部ブラウザで行うため Apple 3.1.1 非対象。 */}
        {/* 審査で問題が出た場合は handleOpenWebPlans の url を /app に変えて再申請（Strategy B）。 */}
        {isNative() && (
          <div style={{
            background: 'linear-gradient(135deg,#FCE4EC,#FFF8F9)',
            border: '1.5px solid #F48FB1',
            borderRadius: 20, padding: '20px 18px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#C2185B', marginBottom: 4 }}>
              💳 プランを登録・変更する
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.7 }}>
              Safariで安全に手続きできます。<br />
              ふぅと同じメールアドレスでログインしてください。
            </div>

            {/* ミニプランカード */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {/* スタンダード */}
              <div style={{
                flex: 1, background: '#fff', borderRadius: 12, padding: '12px 10px',
                border: '1.5px solid #FCE4EC', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#E91E63', fontWeight: 700, marginBottom: 2 }}>スタンダード</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#333' }}>¥300</div>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>/月（税込）</div>
                <div style={{ fontSize: 10, color: '#666', lineHeight: 1.6 }}>
                  月200会話<br />4人のキャラ
                </div>
              </div>
              {/* プレミアム */}
              <div style={{
                flex: 1, background: 'linear-gradient(160deg,#FFF0F5,#FFE4EF)',
                borderRadius: 12, padding: '12px 10px',
                border: '2px solid #E91E63', textAlign: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>おすすめ</div>
                <div style={{ fontSize: 11, color: '#C2185B', fontWeight: 700, marginBottom: 2, marginTop: 4 }}>プレミアム</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#333' }}>¥980</div>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>/月（税込）</div>
                <div style={{ fontSize: 10, color: '#666', lineHeight: 1.6 }}>
                  月900会話<br />全キャラ＋専用
                </div>
              </div>
            </div>

            {/* プランページを開くボタン */}
            <button
              onClick={handleOpenWebPlans}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                color: '#fff', border: 'none', borderRadius: 50,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🌐 プランを見る →
            </button>
            <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              Safariで開きます · いつでも解約できます
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

        {/* トライアル説明（ウェブ版のみ表示） */}
        {!isNative() && (
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
        )}

        {/* キャッチコピー（ウェブ版のみ） */}
        {!isNative() && (
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: '4px 0 8px', lineHeight: 1.7 }}>
          トライアル終了後も、ふぅと続けよう。<br />
          いつでも解約できます。
        </p>
        )}

        {/* プランカード（ウェブ版のみ） */}
        {!isNative() && PLANS.map(plan => {
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
                {pendingWithdrawal ? (
                  // 退会予約中はボタン非表示
                  isCurrentPlan ? (
                    <div style={{
                      textAlign: 'center', padding: '12px',
                      background: '#FFF3E0', borderRadius: 50,
                      fontSize: 12, color: '#E65100',
                    }}>
                      🚪 退会予約中
                    </div>
                  ) : null
                ) : isCurrentPlan ? (
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

        {/* ─── チケット購入カード（ウェブ版のみ） ─── */}
        {!isNative() && (currentPlan === 'standard' || currentPlan === 'premium') && (
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

        {/* 注意書き（ウェブ版のみ） */}
        {!isNative() && (
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.9, marginTop: 4 }}>
          <p style={{ margin: 0 }}>
            ・お支払いはクレジットカード・Apple Pay・Google Pay（Stripe決済）<br />
            ・毎月同日に自動更新、いつでもキャンセル可能<br />
            ・解約後も次回更新日まで利用できます
          </p>
        </div>
        )}

        {/* デモモード案内（ウェブ版のみ） */}
        {!isNative() && !isSupabaseConfigured && (
          <div style={{
            background: '#FFF8E1', border: '1px solid #FFD54F',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 12, color: '#F57F17', textAlign: 'center', lineHeight: 1.7,
          }}>
            ⚙️ デモモード：Stripe設定後に実際の決済が使えます。<br />
            <strong>STRIPE_SETUP.md</strong> を参照してください。
          </div>
        )}

        {/* 解約・退会は設定画面から */}
        {(currentPlan === 'standard' || currentPlan === 'premium') && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #FCE4EC', textAlign: 'center' }}>
            <button
              onClick={() => router.push('/app/settings')}
              style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              解約・退会は設定画面から
            </button>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>

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
