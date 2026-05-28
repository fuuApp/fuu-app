'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getActiveTracks, getTrackByIdIncludeInactive,
  getFavoriteIds, toggleFavorite,
  BGM_ENABLED_KEY,
  type BgmTrack,
} from '@/lib/bgm'

const MOOD_LABELS = {
  chill:     { label:'チル',    emoji:'🌿', color:'#00695C', bg:'#E0F2F1' },
  happy:     { label:'元気',    emoji:'☀️', color:'#E65100', bg:'#FBE9E7' },
  emotional: { label:'泣きたい',emoji:'🌧️', color:'#1565C0', bg:'#E3F2FD' },
} as const

export default function BgmPage() {
  const router = useRouter()
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [bgmEnabled, setBgmEnabled] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all'|'favorite'|BgmTrack['mood']>('all')
  const [toast, setToast] = useState('')

  useEffect(() => {
    setFavoriteIds(getFavoriteIds())
    const e = localStorage.getItem(BGM_ENABLED_KEY)
    setBgmEnabled(e === null ? true : e === 'true')
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 2000) }
  const handleToggleFavorite = (id: string) => {
    const added = toggleFavorite(id)
    setFavoriteIds(getFavoriteIds())
    showToast(added ? '❤️ お気に入りに追加しました' : 'お気に入りから外しました')
  }

  const allActive = getActiveTracks()
  const favoriteTracks = favoriteIds.map(id=>getTrackByIdIncludeInactive(id)).filter((t): t is BgmTrack => !!t)
  const inactiveFavorites = favoriteTracks.filter(t => !t.isActive)
  const displayTracks = activeFilter==='favorite' ? favoriteTracks : activeFilter==='all' ? allActive : allActive.filter(t=>t.mood===activeFilter)

  return (
    <div style={{ maxWidth:480,margin:'0 auto',background:'#fdf4f7',minHeight:'100dvh' }}>
      <div style={{ background:'#fff',borderBottom:'1px solid #FCE4EC',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={()=>router.push('/app/settings')} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#E91E63',padding:4 }}>‹</button>
        <span style={{ fontWeight:700,fontSize:16,color:'#333' }}>BGM・サウンド</span>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:12,color:bgmEnabled?'#E91E63':'#aaa' }}>{bgmEnabled?'🎵':'🔇'}</span>
          <button onClick={()=>{ const n=!bgmEnabled; setBgmEnabled(n); localStorage.setItem(BGM_ENABLED_KEY,String(n)) }}
            style={{ width:44,height:24,borderRadius:12,border:'none',background:bgmEnabled?'#E91E63':'#ddd',position:'relative',cursor:'pointer',transition:'background 0.2s' }}>
            <span style={{ position:'absolute',top:2,left:bgmEnabled?22:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)' }} />
          </button>
        </div>
      </div>

      <div style={{ padding:16 }}>
        {toast && <div style={{ background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:12,padding:'10px 16px',fontSize:13,color:'#2E7D32',textAlign:'center',marginBottom:12 }}>{toast}</div>}

        <div style={{ display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4 }}>
          {([{key:'all',label:'すべて',emoji:'🎵'},{key:'favorite',label:`お気に入り(${favoriteIds.length})`,emoji:'❤️'},{key:'chill',label:'チル',emoji:'🌿'},{key:'happy',label:'元気',emoji:'☀️'},{key:'emotional',label:'泣きたい',emoji:'🌧️'}] as const).map(f=>(
            <button key={f.key} onClick={()=>setActiveFilter(f.key)} style={{ flexShrink:0,padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',background:activeFilter===f.key?'#E91E63':'#fff',color:activeFilter===f.key?'#fff':'#888',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {activeFilter==='favorite' && inactiveFavorites.length>0 && (
          <div style={{ background:'#FFF8E1',border:'1px solid #FFD54F',borderRadius:12,padding:'10px 14px',fontSize:12,color:'#F57F17',marginBottom:12 }}>⭐ お気に入り登録した曲は月次更新後も聴き続けられます</div>
        )}

        {displayTracks.length===0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',color:'#bbb' }}>
            <div style={{ fontSize:32,marginBottom:12 }}>{activeFilter==='favorite'?'❤️':'🎵'}</div>
            <div style={{ fontSize:14 }}>{activeFilter==='favorite'?'お気に入りがまだありません':'曲がありません'}</div>
          </div>
        ) : displayTracks.map(track => {
          const isFav = favoriteIds.includes(track.id)
          const ms = MOOD_LABELS[track.mood]
          return (
            <div key={track.id} style={{ background:'#fff',borderRadius:18,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:14,boxShadow:'0 2px 8px rgba(233,30,99,0.07)',opacity:!track.isActive?0.7:1 }}>
              <div style={{ width:48,height:48,borderRadius:14,flexShrink:0,background:ms.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{track.emoji}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                  <span style={{ fontWeight:700,fontSize:14,color:'#333' }}>{track.title}</span>
                  {!track.isActive && <span style={{ fontSize:10,color:'#aaa',background:'#f0f0f0',borderRadius:8,padding:'1px 6px' }}>保存済み</span>}
                </div>
                <div style={{ fontSize:11,color:ms.color,marginBottom:2,fontWeight:600 }}>{ms.emoji} {ms.label}</div>
                <div style={{ fontSize:12,color:'#888',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{track.description}</div>
              </div>
              <button onClick={()=>handleToggleFavorite(track.id)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:22,flexShrink:0,padding:4,transition:'transform 0.1s' }}
                onMouseDown={e=>(e.currentTarget.style.transform='scale(0.85)')} onMouseUp={e=>(e.currentTarget.style.transform='scale(1)')} title={isFav?'お気に入りから外す':'お気に入りに追加'}>
                {isFav?'❤️':'🤍'}
              </button>
            </div>
          )
        })}
        <p style={{ fontSize:11,color:'#ccc',textAlign:'center',marginTop:12,lineHeight:1.8 }}>❤️ ハートを押してお気に入り登録<br />登録した曲は月次更新後も残ります</p>
      </div>
    </div>
  )
}
