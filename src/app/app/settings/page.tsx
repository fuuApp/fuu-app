'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NICKNAME_KEY = 'fuu_nickname'
const NICKNAME_SET_KEY = 'fuu_nickname_set'
const SESSION_CONFIRMED_KEY = 'fuu_nickname_confirmed'
const TRIAL_START_KEY = 'fuu_trial_started_at'
const TRIAL_DAYS = 10
const BGM_KEY = 'fuu_bgm_enabled'

type WithdrawalType = 'scheduled' | 'immediate'

function DeleteAccountModal({ onImmediate, onScheduled, onCancel, isDeleting, isTrial, periodEndDate, error }: {
  onImmediate: () => void
  onScheduled: () => void
  onCancel: () => void
  isDeleting: boolean
  error?: string
  isTrial: boolean
  periodEndDate: string | null
}) {
  const [step, setStep] = useState<'choose' | 'confirm'>(isTrial ? 'confirm' : 'choose')
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('immediate')
  const [confirmText, setConfirmText] = useState('')
  const REQUIRED = '退会する'
  const ready = confirmText === REQUIRED && !isDeleting

  const periodEndFormatted = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
    : '次回更新日'

  const handleChoose = (type: WithdrawalType) => {
    setWithdrawalType(type)
    setStep('confirm')
  }

  const handleConfirm = () => {
    withdrawalType === 'scheduled' ? onScheduled() : onImmediate()
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div style={{ width:'100%',maxWidth:480,background:'#fff',borderRadius:'20px 20px 0 0',padding:'28px 24px 44px',boxShadow:'0 -4px 20px rgba(0,0,0,0.15)',maxHeight:'90dvh',overflowY:'auto' }}>

        {/* ── STEP 1: 退会方法を選ぶ（有料プランのみ） ── */}
        {step === 'choose' && (
          <>
            <div style={{ fontSize:28,textAlign:'center',marginBottom:10 }}>🚪</div>
            <div style={{ fontWeight:700,fontSize:17,color:'#333',textAlign:'center',marginBottom:6 }}>退会方法を選んでください</div>
            <div style={{ fontSize:12,color:'#aaa',textAlign:'center',marginBottom:20 }}>どちらの方法でも料金の返金はありません</div>

            {/* カードA: 次回更新日まで使って退会 */}
            <div style={{ background:'#F3F8FF',border:'2px solid #90CAF9',borderRadius:16,padding:'16px 18px',marginBottom:12 }}>
              <div style={{ fontWeight:700,fontSize:14,color:'#1565C0',marginBottom:6 }}>
                📅 {periodEndFormatted}まで使って退会
              </div>
              <div style={{ fontSize:12,color:'#555',lineHeight:1.8,marginBottom:14 }}>
                残りの期間は引き続きご利用いただけます。<br />
                {periodEndFormatted}にアカウントが<strong>自動削除</strong>されます。
              </div>
              <button
                onClick={() => handleChoose('scheduled')}
                style={{ width:'100%',padding:'11px',background:'linear-gradient(135deg,#1976D2,#1565C0)',color:'#fff',border:'none',borderRadius:50,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}
              >
                この方法で退会する →
              </button>
            </div>

            {/* カードB: 今すぐ退会 */}
            <div style={{ background:'#FFF5F5',border:'2px solid #FFCDD2',borderRadius:16,padding:'16px 18px',marginBottom:20 }}>
              <div style={{ fontWeight:700,fontSize:14,color:'#C62828',marginBottom:6 }}>
                🚪 今すぐ退会する
              </div>
              <div style={{ fontSize:12,color:'#555',lineHeight:1.8,marginBottom:14 }}>
                サブスクを即時キャンセルし、<br />
                アカウントをすぐに削除します。
              </div>
              <button
                onClick={() => handleChoose('immediate')}
                style={{ width:'100%',padding:'11px',background:'linear-gradient(135deg,#E57373,#C62828)',color:'#fff',border:'none',borderRadius:50,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}
              >
                今すぐ退会する →
              </button>
            </div>

            <button onClick={onCancel}
              style={{ width:'100%',background:'#f5f5f5',border:'none',borderRadius:14,padding:'13px 0',fontSize:14,color:'#666',cursor:'pointer',fontFamily:'inherit' }}>
              キャンセル
            </button>
          </>
        )}

        {/* ── STEP 2: 確認・実行 ── */}
        {step === 'confirm' && (
          <>
            <div style={{ fontSize:28,textAlign:'center',marginBottom:10 }}>⚠️</div>
            <div style={{ fontWeight:700,fontSize:17,color:'#333',textAlign:'center',marginBottom:16 }}>退会の確認</div>

            {/* 選択内容サマリー */}
            {!isTrial && (
              <div style={{
                background: withdrawalType === 'scheduled' ? '#E3F2FD' : '#FFEBEE',
                border: `1px solid ${withdrawalType === 'scheduled' ? '#90CAF9' : '#FFCDD2'}`,
                borderRadius:12,padding:'12px 14px',marginBottom:14,fontSize:12,
                color: withdrawalType === 'scheduled' ? '#1565C0' : '#C62828',
                lineHeight:1.7,
              }}>
                {withdrawalType === 'scheduled'
                  ? `📅 ${periodEndFormatted}にアカウントが自動削除されます。それまでは引き続きご利用いただけます。`
                  : '🚪 退会ボタンを押すとすぐにアカウントが削除されます。'}
              </div>
            )}

            {/* 削除されるデータ */}
            <div style={{ background:'#FFF8E1',border:'1px solid #FFD54F',borderRadius:14,padding:'14px 16px',marginBottom:14 }}>
              <div style={{ fontWeight:700,fontSize:13,color:'#F57F17',marginBottom:8 }}>削除されるデータ</div>
              <div style={{ fontSize:12,color:'#555',lineHeight:1.9 }}>
                ・すべての会話履歴<br />
                ・気持ちの箱（愚痴の変換記録）<br />
                ・ニックネーム・設定情報<br />
                ・アカウント情報<br />
                {(!isTrial && withdrawalType === 'immediate') && <>・月額サブスクリプション（即時キャンセル）</>}
              </div>
            </div>

            {/* 確認入力 */}
            <div style={{ background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:14,padding:'14px 16px',marginBottom:16 }}>
              <div style={{ fontSize:12,color:'#888',marginBottom:8 }}>
                「<strong style={{ color:'#E57373' }}>退会する</strong>」と入力して{withdrawalType === 'scheduled' ? '退会を予約' : '退会'}してください
              </div>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="退会する"
                disabled={isDeleting}
                style={{ width:'100%',border:'1.5px solid #FFCDD2',borderRadius:12,padding:'10px 14px',fontSize:14,outline:'none',background:isDeleting?'#fafafa':'#fff',fontFamily:'inherit',boxSizing:'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:12,padding:'12px 14px',fontSize:13,color:'#C62828',marginBottom:12 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display:'flex',gap:10 }}>
              <button
                onClick={() => isTrial ? onCancel() : setStep('choose')}
                disabled={isDeleting}
                style={{ flex:1,background:'#f5f5f5',border:'none',borderRadius:14,padding:'13px 0',fontSize:14,color:'#666',cursor:'pointer',fontFamily:'inherit' }}
              >
                {isTrial ? 'キャンセル' : '← 戻る'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!ready}
                style={{ flex:1,background:ready?'#E57373':'#eee',border:'none',borderRadius:14,padding:'13px 0',fontSize:14,fontWeight:700,color:ready?'#fff':'#bbb',cursor:ready?'pointer':'not-allowed',fontFamily:'inherit',transition:'background 0.2s' }}
              >
                {isDeleting ? '処理中...' : withdrawalType === 'scheduled' ? '退会を予約する' : '退会する'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

function calcTrialDaysLeftFromDate(trialStartedAt: string | null): number {
  if (!trialStartedAt) return TRIAL_DAYS
  return Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86400000))
}

export default function SettingsPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(TRIAL_DAYS)
  const [userPlan, setUserPlan] = useState<'trial'|'standard'|'premium'|'canceled'>('trial')
  const [bgmEnabled, setBgmEnabled] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [periodEndDate, setPeriodEndDate] = useState<string | null>(null)
  const [withdrawToast, setWithdrawToast] = useState<string | null>(null)
  const [withdrawalScheduled, setWithdrawalScheduled] = useState(false)
  const [withdrawalDate, setWithdrawalDate] = useState<string | null>(null)

  useEffect(() => {
    const n = localStorage.getItem(NICKNAME_KEY) ?? ''
    setNickname(n); setNicknameInput(n)
    const bgm = localStorage.getItem(BGM_KEY)
    setBgmEnabled(bgm === null ? true : bgm === 'true')
    // Supabase からプラン設定を取得
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, trial_started_at')
          .eq('user_id', user.id)
          .single()
        if (!profile) return
        const plan = profile.plan ?? 'free'
        if (plan === 'premium') setUserPlan('premium')
        else if (plan === 'standard') setUserPlan('standard')
        else if (plan === 'canceled') setUserPlan('canceled')
        else setUserPlan('trial')
        setTrialDaysLeft(calcTrialDaysLeftFromDate(profile.trial_started_at ?? null))
        // サブスク期末日を取得
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('current_period_end')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (sub?.current_period_end) setPeriodEndDate(sub.current_period_end)

        // 退会予約状態を確認（Stripeの cancel_at_period_end + pending_deletion）
        try {
          const schedRes = await fetch(`/api/subscription/schedule?userId=${user.id}`)
          if (schedRes.ok) {
            const schedData = await schedRes.json()
            if (schedData.pendingWithdrawal) {
              setWithdrawalScheduled(true)
              setWithdrawalDate(schedData.withdrawalDate ?? null)
            }
          }
        } catch {}
      } catch {}
    })()
  }, [])

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim()
    localStorage.setItem(NICKNAME_KEY, trimmed); localStorage.setItem(NICKNAME_SET_KEY, 'true')
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname(trimmed); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true); setDeleteError('')
    try {
      // JWTトークンをAuthorizationヘッダーで送信（セキュリティ強化）
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setDeleteError('セッションが切れています。再ログインしてください。')
        setIsDeleting(false)
        return
      }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (!res.ok) { const d = await res.json(); setDeleteError(d.error ?? '退会に失敗しました'); setIsDeleting(false); return }
      // セッションクッキーを削除してから遷移（削除後もアクセス可能になるバグ防止）
      try { await supabase.auth.signOut() } catch {}
      localStorage.clear(); sessionStorage.clear(); router.replace('/')
    } catch { setDeleteError('通信エラーが発生しました。しばらくしてからお試しください。'); setIsDeleting(false) }
  }
  const handleScheduledWithdraw = async () => {
    setIsDeleting(true); setDeleteError('')
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingDeletion: true }),
      })
      const d = await res.json()
      if (!res.ok) { setDeleteError(d.error ?? '退会予約に失敗しました'); setIsDeleting(false); return }
      // 退会予約成功 → 即バナー反映（ページリロードを待たずに表示）
      setWithdrawalScheduled(true)
      if (d.cancelAt) setWithdrawalDate(new Date(d.cancelAt).toISOString())
      setShowDeleteModal(false)
      // cancelAt: APIがStripeから返す実際の解約日（ISO文字列）
      const dateStr = d.cancelAt ?? periodEndDate ?? null
      const date = dateStr
        ? new Date(dateStr).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
        : '次回更新日'
      setWithdrawToast(`📅 退会を予約しました。${date}までご利用いただけます。`)
      setTimeout(() => setWithdrawToast(null), 5000)
    } catch { setDeleteError('通信エラーが発生しました。'); }
    setIsDeleting(false)
  }

  const handleClearNickname = () => {
    localStorage.removeItem(NICKNAME_KEY); localStorage.removeItem(NICKNAME_SET_KEY)
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname(''); setNicknameInput(''); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth:480,margin:'0 auto',background:'#fdf4f7',minHeight:'100dvh' }}>
      {showDeleteModal && (
        <DeleteAccountModal
          onImmediate={handleDeleteAccount}
          onScheduled={handleScheduledWithdraw}
          onCancel={() => { setShowDeleteModal(false); setDeleteError('') }}
          isDeleting={isDeleting}
          isTrial={userPlan === 'trial' || userPlan === 'canceled'}
          periodEndDate={periodEndDate}
          error={deleteError}
        />
      )}
      {withdrawToast && (
        <div style={{ position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:'#1565C0',color:'#fff',borderRadius:16,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:200,whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          {withdrawToast}
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ background:'#fff',borderBottom:'1px solid #FCE4EC',padding:'14px 16px',paddingTop:'calc(env(safe-area-inset-top) + 14px)',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={() => router.push('/app')} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',padding:'6px 0',fontFamily:'inherit',lineHeight:1 }}>
          <span style={{ fontSize:20,color:'#E91E63',lineHeight:1 }}>‹</span>
          <span style={{ fontWeight:700,fontSize:16,color:'#333' }}>設定</span>
        </button>
      </div>

      <div style={{ padding:'20px 16px',display:'flex',flexDirection:'column',gap:12 }}>
        {saved && <div style={{ background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:12,padding:'10px 16px',fontSize:13,color:'#2E7D32',textAlign:'center' }}>✅ 保存しました</div>}

        {/* ニックネーム */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>呼び名</div>
          {editing ? (
            <div style={{ padding:16 }}>
              <p style={{ fontSize:13,color:'#888',marginBottom:12 }}>AIたちが会話の中で呼ぶ名前です。本名でなくてOK。</p>
              <div style={{ display:'flex',gap:8,marginBottom:12 }}>
                <input value={nicknameInput} onChange={e=>setNicknameInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSaveNickname()} placeholder="例：ゆいちゃん、まーちゃん..." maxLength={20} autoFocus
                  style={{ flex:1,border:'1.5px solid #F48FB1',borderRadius:20,padding:'10px 16px',fontSize:14,outline:'none',background:'#fdf4f7',fontFamily:'inherit' }} />
                <button onClick={handleSaveNickname} style={{ background:'linear-gradient(135deg,#E91E63,#C2185B)',border:'none',borderRadius:20,padding:'10px 18px',fontSize:13,color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:700 }}>保存</button>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={()=>{setEditing(false);setNicknameInput(nickname)}} style={{ background:'none',border:'1px solid #ddd',borderRadius:20,padding:'6px 14px',fontSize:12,color:'#888',cursor:'pointer',fontFamily:'inherit' }}>キャンセル</button>
                {nickname && <button onClick={handleClearNickname} style={{ background:'none',border:'1px solid #FFCDD2',borderRadius:20,padding:'6px 14px',fontSize:12,color:'#E57373',cursor:'pointer',fontFamily:'inherit' }}>呼び名をなしにする</button>}
              </div>
            </div>
          ) : (
            <div style={{ padding:16,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontSize:16,color:nickname?'#333':'#aaa',fontWeight:nickname?600:400 }}>{nickname||'未設定（「あなた」と呼ばれます）'}</div>
              <button onClick={()=>setEditing(true)} style={{ background:'#FCE4EC',border:'none',borderRadius:16,padding:'6px 14px',fontSize:13,color:'#E91E63',cursor:'pointer',fontFamily:'inherit' }}>変更</button>
            </div>
          )}
        </div>

        {/* BGM */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>BGM・サウンド</div>
          <div style={{ padding:16,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:15,color:'#333',fontWeight:600,marginBottom:2 }}>BGMをオンにする</div>
              <div style={{ fontSize:12,color:'#aaa' }}>{bgmEnabled?'🎵 チャット中にBGMが流れます':'🔇 BGMはオフです'}</div>
            </div>
            <button onClick={()=>{ const n=!bgmEnabled; setBgmEnabled(n); localStorage.setItem(BGM_KEY,String(n)) }}
              style={{ width:50,height:28,borderRadius:14,border:'none',background:bgmEnabled?'#E91E63':'#ddd',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0 }}>
              <span style={{ position:'absolute',top:3,left:bgmEnabled?25:3,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
          <div style={{ padding:'0 16px 16px' }}>
            <button onClick={()=>router.push('/app/bgm')} style={{ width:'100%',padding:'10px 16px',background:'#fdf4f7',border:'1px solid #F48FB1',borderRadius:12,fontSize:13,color:'#E91E63',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span>🎵 曲を選ぶ・お気に入り登録</span><span style={{ color:'#F48FB1',fontSize:16 }}>›</span>
            </button>
          </div>
        </div>

        {/* プラン */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>現在のプラン</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <span style={{ background:userPlan==='premium'?'linear-gradient(135deg,#C2185B,#880E4F)':userPlan==='standard'?'linear-gradient(135deg,#F48FB1,#E91E63)':userPlan==='canceled'?'#9E9E9E':'linear-gradient(135deg,#E91E63,#C2185B)',color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700 }}>
                {userPlan==='trial'?'無料トライアル中':userPlan==='premium'?'プレミアム':userPlan==='canceled'?'解約済み':'スタンダード'}
              </span>
              {userPlan==='trial' && <span style={{ fontSize:12,color:trialDaysLeft<=3?'#E91E63':'#aaa',fontWeight:trialDaysLeft<=3?700:400 }}>残り{trialDaysLeft}日</span>}
            </div>
            {/* 退会予約中バナー */}
            {withdrawalScheduled && (
              <div style={{ background:'#FFF3E0',border:'1.5px solid #FFB74D',borderRadius:12,padding:'12px 14px',marginTop:10,fontSize:13,color:'#E65100',lineHeight:1.8 }}>
                🚪 <strong>退会を予約しました</strong><br />
                {withdrawalDate
                  ? <>{new Date(withdrawalDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}まで引き続きご利用いただけます。<br /><span style={{ fontSize:12 }}>{new Date(withdrawalDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}にアカウントが自動削除されます。</span></>
                  : '次回更新日まで引き続きご利用いただけます。次回更新日にアカウントが削除されます。'
                }
              </div>
            )}
            {!withdrawalScheduled && (
              <p style={{ fontSize:13,color:'#888',margin:'8px 0 0',lineHeight:1.7 }}>
                {userPlan==='trial'?(trialDaysLeft>0?<>トライアル終了後は月額プランへ。<br />いつでもキャンセルできます。</>:<>トライアルが終了しました。<br />プランを選んで続けましょう。</>):userPlan==='canceled'?<>プランが終了しています。<br />またいつでも再開できます。</>:<>いつでもキャンセルできます。<br />解約後もその月末まで利用できます。</>}
              </p>
            )}
            <button onClick={()=>router.push('/app/plans')} style={{ marginTop:12,background:'none',border:'1px solid #F48FB1',borderRadius:20,padding:'8px 16px',fontSize:13,color:'#E91E63',cursor:'pointer',fontFamily:'inherit' }}>プランを見る →</button>
          </div>
        </div>

        {/* アカウント */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>アカウント</div>
          {[{label:'利用規約',href:'/terms'},{label:'プライバシーポリシー',href:'/privacy'},{label:'特定商取引法に基づく表記',href:'/tokusho'}].map((item,i)=>(
            <a key={i} href={item.href} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid #fdf4f7',fontSize:14,color:'#555',textDecoration:'none' }}>
              {item.label}<span style={{ color:'#ccc',fontSize:16 }}>›</span>
            </a>
          ))}
          <button
            onClick={async () => {
              try { const { createClient } = await import('@/lib/supabase'); await createClient().auth.signOut() } catch {}
              router.push('/signin')
            }}
            style={{ width:'100%',padding:'14px 16px',background:'none',border:'none',fontSize:14,color:'#E57373',cursor:'pointer',textAlign:'left',fontFamily:'inherit',borderBottom:'1px solid #fdf4f7' }}
          >ログアウト</button>
          {withdrawalScheduled ? (
            <div style={{ width:'100%',padding:'14px 16px',fontSize:14,color:'#FFB74D',textAlign:'left' }}>
              🚪 退会予約済み{withdrawalDate ? `（${new Date(withdrawalDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}に削除）` : ''}
            </div>
          ) : (
            <button onClick={()=>setShowDeleteModal(true)}
              style={{ width:'100%',padding:'14px 16px',background:'none',border:'none',fontSize:14,color:'#bbb',cursor:'pointer',textAlign:'left',fontFamily:'inherit' }}>
              退会する
            </button>
          )}
        </div>

        {deleteError && <div style={{ background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:12,padding:'12px 16px',fontSize:13,color:'#C62828' }}>⚠️ {deleteError}</div>}
        <p style={{ textAlign:'center',fontSize:11,color:'#ccc',marginTop:8 }}>fuu ふぅ v1.0.0</p>
      </div>
    </div>
  )
}
