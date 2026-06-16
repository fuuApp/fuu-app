'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NICKNAME_KEY = 'fuu_nickname'
const NICKNAME_SET_KEY = 'fuu_nickname_set'
const SESSION_CONFIRMED_KEY = 'fuu_nickname_confirmed'
const TRIAL_START_KEY = 'fuu_trial_started_at'
const TRIAL_DAYS = 10
const BGM_KEY = 'fuu_bgm_enabled'

function DeleteAccountModal({ onConfirm, onCancel, isDeleting }: {
  onConfirm: () => void; onCancel: () => void; isDeleting: boolean
}) {
  const [confirmText, setConfirmText] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const REQUIRED = '退会する'
  const ready = confirmText === REQUIRED && !isDeleting

  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div style={{ width:'100%',maxWidth:480,background:'#fff',borderRadius:'20px 20px 0 0',padding:'28px 24px 44px',boxShadow:'0 -4px 20px rgba(0,0,0,0.15)',maxHeight:'90dvh',overflowY:'auto' }}>
        <div style={{ fontSize:32,textAlign:'center',marginBottom:12 }}>⚠️</div>
        <div style={{ fontWeight:700,fontSize:17,color:'#333',textAlign:'center',marginBottom:16 }}>退会の前に必ずご確認ください</div>

        {/* STEP 1: サブスクキャンセル案内 */}
        <div style={{ background:'#FFF3E0',border:'1px solid #FFB74D',borderRadius:14,padding:'14px 16px',marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:13,color:'#E65100',marginBottom:8 }}>📌 STEP 1：サブスクリプションを先にキャンセル</div>
          <div style={{ fontSize:12,color:'#555',lineHeight:1.8 }}>
            月額プラン（スタンダード・プレミアム）をご利用中の場合、<strong>退会前に必ずサブスクリプションをキャンセル</strong>してください。<br /><br />
            退会後もサブスクリプションは自動継続されます。キャンセルしないと引き落としが続きます。
          </div>
          <div style={{ marginTop:10,background:'#fff',borderRadius:10,padding:'10px 12px',border:'1px solid #FFD180' }}>
            <div style={{ fontSize:11,color:'#F57F17',fontWeight:700,marginBottom:6 }}>▼ キャンセル手順（Stripe）</div>
            <div style={{ fontSize:11,color:'#555',lineHeight:1.9 }}>
              1. <a href="https://billing.stripe.com/p/login" target="_blank" rel="noreferrer" style={{ color:'#E91E63',fontWeight:700 }}>billing.stripe.com</a> にアクセス<br />
              2. ご登録のメールアドレスでログイン<br />
              3.「サブスクリプション」→「キャンセル」をタップ<br />
              4. キャンセル完了のメールを確認<br />
              5. キャンセル後にこの退会手続きへ進む
            </div>
          </div>
        </div>

        {/* STEP 2: 削除されるデータ */}
        <div style={{ background:'#FFF8E1',border:'1px solid #FFD54F',borderRadius:14,padding:'14px 16px',marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:13,color:'#F57F17',marginBottom:8 }}>📌 STEP 2：削除されるデータを確認</div>
          <div style={{ fontSize:12,color:'#555',lineHeight:1.9 }}>
            退会すると以下のデータが<strong>完全に削除</strong>され、復元できません：<br />
            ・すべての会話履歴<br />
            ・気持ちの箱（愚痴の変換記録）<br />
            ・ニックネーム・設定情報<br />
            ・アカウント情報<br /><br />
            ※ サブスクリプション未キャンセルのまま退会した場合の返金はできかねます。
          </div>
        </div>

        {/* STEP 3: 確認入力 */}
        <div style={{ background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:14,padding:'14px 16px',marginBottom:16 }}>
          <div style={{ fontWeight:700,fontSize:13,color:'#C62828',marginBottom:8 }}>📌 STEP 3：退会を実行</div>
          <div style={{ fontSize:12,color:'#888',marginBottom:8 }}>
            サブスクキャンセル完了後、「<strong style={{ color:'#E57373' }}>退会する</strong>」と入力して退会ボタンを押してください
          </div>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="退会する"
            disabled={isDeleting}
            style={{ width:'100%',border:'1.5px solid #FFCDD2',borderRadius:12,padding:'10px 14px',fontSize:14,outline:'none',background:isDeleting?'#fafafa':'#fff',fontFamily:'inherit',boxSizing:'border-box' }}
          />
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onCancel} disabled={isDeleting}
            style={{ flex:1,background:'#f5f5f5',border:'none',borderRadius:14,padding:'13px 0',fontSize:14,color:'#666',cursor:'pointer',fontFamily:'inherit' }}>
            キャンセル
          </button>
          <button onClick={onConfirm} disabled={!ready}
            style={{ flex:1,background:ready?'#E57373':'#eee',border:'none',borderRadius:14,padding:'13px 0',fontSize:14,fontWeight:700,color:ready?'#fff':'#bbb',cursor:ready?'pointer':'not-allowed',fontFamily:'inherit',transition:'background 0.2s' }}>
            {isDeleting ? '処理中...' : '退会する'}
          </button>
        </div>
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
  const [userPlan, setUserPlan] = useState<'trial'|'standard'|'premium'>('trial')
  const [bgmEnabled, setBgmEnabled] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [morningTime, setMorningTime] = useState('07:00')
  const [eveningTime, setEveningTime] = useState('21:00')
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const n = localStorage.getItem(NICKNAME_KEY) ?? ''
    setNickname(n); setNicknameInput(n)
    const bgm = localStorage.getItem(BGM_KEY)
    setBgmEnabled(bgm === null ? true : bgm === 'true')
    const mt = localStorage.getItem('fuu_morning_time'); if (mt) setMorningTime(mt)
    const et = localStorage.getItem('fuu_evening_time'); if (et) setEveningTime(et)
    // 通知権限の現在状態を取得
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
    // Service Worker 登録
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // Supabaseからプランとtrial_started_atを取得
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
        else setUserPlan('trial')
        setTrialDaysLeft(calcTrialDaysLeftFromDate(profile.trial_started_at ?? null))
      } catch {}
    })()
  }, [])

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim()
    localStorage.setItem(NICKNAME_KEY, trimmed); localStorage.setItem(NICKNAME_SET_KEY, 'true')
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname(trimmed); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }
  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    localStorage.setItem('fuu_morning_time', morningTime)
    localStorage.setItem('fuu_evening_time', eveningTime)

    try {
      // 通知権限リクエスト
      if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        setNotifPermission(permission)

        if (permission === 'granted') {
          // Service Worker にスケジュールを送信
          const reg = await navigator.serviceWorker.ready
          if (reg.active) {
            reg.active.postMessage({
              type: 'SCHEDULE_NOTIFICATIONS',
              morningTime,
              eveningTime,
            })
          }
        }
      }
    } catch { /* 通知API非対応端末は無視 */ }

    setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2500); setNotifSaving(false)
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
      localStorage.clear(); sessionStorage.clear(); router.replace('/')
    } catch { setDeleteError('通信エラーが発生しました。しばらくしてからお試しください。'); setIsDeleting(false) }
  }
  const handleClearNickname = () => {
    localStorage.removeItem(NICKNAME_KEY); localStorage.removeItem(NICKNAME_SET_KEY)
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname(''); setNicknameInput(''); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth:480,margin:'0 auto',background:'#fdf4f7',minHeight:'100dvh' }}>
      {showDeleteModal && <DeleteAccountModal onConfirm={handleDeleteAccount} onCancel={() => { setShowDeleteModal(false); setDeleteError('') }} isDeleting={isDeleting} />}

      {/* ヘッダー */}
      <div style={{ background:'#fff',borderBottom:'1px solid #FCE4EC',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={() => router.push('/app')} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#E91E63',padding:4 }}>‹</button>
        <span style={{ fontWeight:700,fontSize:16,color:'#333' }}>設定</span>
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

        {/* 通知設定（スタンダード・プレミアム共通） */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>通知設定</div>
          <div style={{ padding:16 }}>
            {notifPermission === 'denied' && (
              <div style={{ background:'#FFF3E0',border:'1px solid #FFB74D',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#E65100',lineHeight:1.7 }}>
                ⚠️ ブラウザの通知がブロックされています。<br />
                ブラウザの設定から「fuu-app.vercel.app」の通知を許可してください。
              </div>
            )}
            {notifPermission === 'granted' && (
              <div style={{ background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:10,padding:'8px 14px',marginBottom:14,fontSize:12,color:'#2E7D32' }}>
                🔔 通知が許可されています
              </div>
            )}
            <p style={{ fontSize:12,color:'#aaa',marginBottom:16,lineHeight:1.7 }}>
              朝・夜のリマインダーを届けます。<br />
              「保存する」を押すと通知の許可を求めます。<br />
              ※ ブラウザを開いているときに通知が届きます
            </p>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13,fontWeight:600,color:'#555',marginBottom:6 }}>🌅 おはようリマインダー</div>
              <input type="time" value={morningTime} onChange={e=>setMorningTime(e.target.value)} style={{ border:'1.5px solid #F48FB1',borderRadius:10,padding:'8px 12px',fontSize:16,outline:'none',background:'#fdf4f7',fontFamily:'inherit',color:'#333',width:140 }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13,fontWeight:600,color:'#555',marginBottom:6 }}>🌙 おやすみリマインダー</div>
              <input type="time" value={eveningTime} onChange={e=>setEveningTime(e.target.value)} style={{ border:'1.5px solid #F48FB1',borderRadius:10,padding:'8px 12px',fontSize:16,outline:'none',background:'#fdf4f7',fontFamily:'inherit',color:'#333',width:140 }} />
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <button onClick={handleSaveNotifications} disabled={notifSaving} style={{ background:'linear-gradient(135deg,#E91E63,#C2185B)',border:'none',borderRadius:20,padding:'8px 20px',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit',opacity:notifSaving?0.7:1 }}>
                {notifSaving?'保存中...':notifPermission==='default'?'保存する（通知を許可）':'保存する'}
              </button>
              {notifSaved && <span style={{ fontSize:13,color:'#4CAF50' }}>✅ 設定しました</span>}
            </div>
          </div>
        </div>

        {/* プラン */}
        <div style={{ background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 6px rgba(233,30,99,0.07)' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #FCE4EC',fontSize:12,color:'#E91E63',fontWeight:700 }}>現在のプラン</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <span style={{ background:userPlan==='premium'?'linear-gradient(135deg,#C2185B,#880E4F)':userPlan==='standard'?'linear-gradient(135deg,#F48FB1,#E91E63)':'linear-gradient(135deg,#E91E63,#C2185B)',color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700 }}>
                {userPlan==='trial'?'無料トライアル中':userPlan==='premium'?'プレミアム':'スタンダード'}
              </span>
              {userPlan==='trial' && <span style={{ fontSize:12,color:trialDaysLeft<=3?'#E91E63':'#aaa',fontWeight:trialDaysLeft<=3?700:400 }}>残り{trialDaysLeft}日</span>}
            </div>
            <p style={{ fontSize:13,color:'#888',margin:'8px 0 0',lineHeight:1.7 }}>
              {userPlan==='trial'?(trialDaysLeft>0?<>トライアル終了後は月額プランへ。<br />いつでもキャンセルできます。</>:<>トライアルが終了しました。<br />プランを選んで続けましょう。</>):<>いつでもキャンセルできます。<br />解約後もその月末まで利用できます。</>}
            </p>
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
          <button onClick={()=>setShowDeleteModal(true)}
            style={{ width:'100%',padding:'14px 16px',background:'none',border:'none',fontSize:14,color:'#bbb',cursor:'pointer',textAlign:'left',fontFamily:'inherit' }}>
            退会する
          </button>
        </div>

        {deleteError && <div style={{ background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:12,padding:'12px 16px',fontSize:13,color:'#C62828' }}>⚠️ {deleteError}</div>}
        <p style={{ textAlign:'center',fontSize:11,color:'#ccc',marginTop:8 }}>fuu ふぅ v1.0.0</p>
      </div>
    </div>
  )
}
