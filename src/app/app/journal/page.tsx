'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Journal { id: string; date: string; reframed: string; originalContent?: string; characterId?: string }

const charNames: Record<string, string> = {
  aoi: 'あおい', sakura: 'さくら', rika: 'りか',
  natsuko: 'なつこ', kenji: 'けんじ', hiroshi: 'ひろし',
  yui: 'ゆい', mio: 'みお', haruka: 'はるか', tomomi: 'ともみ',
  ayaka: 'あやか', noriko: 'のりこ', kazuko: 'かずこ', michiko: 'みちこ',
  yoko: 'ようこ', akiko: 'あきこ', reiko: 'れいこ',
  sota: 'そうた', takashi: 'たかし', daisuke: 'だいすけ',
  yusuke: 'ゆうすけ', koji: 'こうじ',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const nowLocal = new Date()
  const now = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate())
  const diff = Math.floor((now.getTime()-d.getTime())/86400000)
  if (diff===0) return '今日'; if (diff===1) return '昨日'; if (diff>1 && diff<7) return `${diff}日前`
  return `${d.getMonth()+1}月${d.getDate()}日`
}

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [deletingId, setDeletingId] = useState<string|null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null)

  useEffect(() => {
    loadJournals()
  }, [])

  async function loadJournals() {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('guchi_journals').select('id,date,reframed,original_content,character_id').order('date',{ascending:false}).limit(30)
        if (data && data.length>0) {
          setJournals(data.map(d=>({id:d.id,date:d.date,reframed:d.reframed,originalContent:d.original_content,characterId:d.character_id})))
          setLoading(false)
          return
        }
      }
      const demo: Journal[] = []
      for (let i=0; i<sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith('fuu_guchi_')) { try { const e=JSON.parse(sessionStorage.getItem(key)??'{}'); if (e.reframed&&e.date) demo.push({id:key,date:e.date,reframed:e.reframed}) } catch {} }
      }
      demo.sort((a,b)=>b.date.localeCompare(a.date))
      setJournals(demo)
    } catch {} finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const supabase = createClient()
      if (id.startsWith('fuu_guchi_')) {
        sessionStorage.removeItem(id)
      } else {
        await supabase.from('guchi_journals').delete().eq('id', id)
      }
      setJournals(prev => prev.filter(j => j.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (e) {
      console.error('Delete error:', e)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div style={{ maxWidth:480,margin:'0 auto',background:'#fdf4f7',minHeight:'100dvh' }}>
      <div style={{ background:'#fff',borderBottom:'1px solid #FCE4EC',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={()=>router.push('/app')} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#E91E63',padding:4 }}>‹</button>
        <div><div style={{ fontWeight:700,fontSize:16,color:'#333' }}>✨ 気持ちの箱</div><div style={{ fontSize:11,color:'#aaa' }}>気持ちを変換した記録</div></div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:'linear-gradient(135deg,#FFF0F5,#FCE4EC)',borderRadius:16,padding:'16px 18px',marginBottom:20,border:'1px solid #F8BBD9' }}>
          <div style={{ fontSize:13,color:'#880E4F',fontWeight:700,marginBottom:6 }}>✨ 気持ちの箱って何？</div>
          <div style={{ fontSize:13,color:'#555',lineHeight:1.7 }}>その日話した愚痴や気持ちを、AIがポジティブな「気持ちの箱」に変換して保存したものです。<br />見返すたびに、あなたが頑張っていたことを思い出せます。</div>
        </div>
        {loading && <div style={{ textAlign:'center',padding:'40px 20px',color:'#aaa' }}><div style={{ fontSize:24,marginBottom:10 }}>⏳</div><div style={{ fontSize:14 }}>読み込み中...</div></div>}
        {!loading && journals.length===0 && (
          <div style={{ textAlign:'center',padding:'40px 20px' }}>
            <div style={{ fontSize:40,marginBottom:16 }}>🧺</div>
            <div style={{ fontSize:16,fontWeight:700,color:'#333',marginBottom:8 }}>まだ気持ちの箱はありません</div>
            <div style={{ fontSize:14,color:'#aaa',lineHeight:1.7,marginBottom:24 }}>AIのママ友と話して、「そろそろ終わりにする」<br />ボタンを押すと気持ちの箱が作られます</div>
            <button onClick={()=>router.push('/app')} style={{ background:'linear-gradient(135deg,#E91E63,#C2185B)',border:'none',borderRadius:24,padding:'12px 28px',fontSize:14,color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:700 }}>話しに行く →</button>
          </div>
        )}
        {!loading && journals.map((journal,index) => (
          <div key={journal.id} style={{ background:'#fff',borderRadius:18,marginBottom:12,boxShadow:'0 2px 8px rgba(233,30,99,0.07)',overflow:'hidden' }}>
            <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:expandedId===journal.id?'1px solid #FCE4EC':'none' }}>
              <div
                onClick={()=>setExpandedId(expandedId===journal.id?null:journal.id)}
                style={{ display:'flex',alignItems:'center',gap:10,flex:1,cursor:'pointer' }}
              >
                <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:index===0?'linear-gradient(135deg,#E91E63,#F48FB1)':'#FCE4EC',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>✨</div>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
                    <div style={{ fontSize:14,fontWeight:700,color:'#333' }}>{formatDate(journal.date)}の気持ちの箱</div>
                    {journal.characterId && journal.characterId !== 'unknown' && (
                      <span style={{ fontSize:11,background:'#FCE4EC',color:'#E91E63',borderRadius:10,padding:'1px 8px',fontWeight:600 }}>
                        {charNames[journal.characterId] ?? journal.characterId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11,color:'#aaa' }}>{journal.date}</div>
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                {/* 削除ボタン */}
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(journal.id) }}
                  style={{ background:'none',border:'none',cursor:'pointer',padding:6,color:'#ccc',fontSize:16,lineHeight:1,borderRadius:8 }}
                  title="削除"
                >
                  🗑️
                </button>
                <span
                  onClick={()=>setExpandedId(expandedId===journal.id?null:journal.id)}
                  style={{ fontSize:16,color:'#ccc',transition:'transform 0.2s',transform:expandedId===journal.id?'rotate(90deg)':'rotate(0)',cursor:'pointer' }}
                >›</span>
              </div>
            </div>
            {expandedId !== journal.id && (
              <div style={{ padding:'8px 16px 12px' }}>
                <div style={{ fontSize:13,color:'#888',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                  {journal.reframed}
                </div>
              </div>
            )}
            {expandedId === journal.id && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:14,color:'#555',lineHeight:1.8,background:'#FFF0F5',borderRadius:12,padding:14,borderLeft:'3px solid #E91E63' }}>
                  {journal.reframed}
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{ height:32 }} />
      </div>

      {/* 削除確認モーダル */}
      {confirmDeleteId && (
        <div
          onClick={() => setConfirmDeleteId(null)}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:'#fff',borderRadius:20,padding:24,maxWidth:320,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}
          >
            <div style={{ fontSize:28,textAlign:'center',marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16,fontWeight:700,color:'#333',textAlign:'center',marginBottom:8 }}>この気持ちの箱を削除しますか？</div>
            <div style={{ fontSize:13,color:'#888',textAlign:'center',marginBottom:24 }}>削除すると元に戻せません。</div>
            <div style={{ display:'flex',gap:10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex:1,background:'#f5f5f5',border:'none',borderRadius:12,padding:'12px 0',fontSize:14,color:'#666',cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}
              >キャンセル</button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                style={{ flex:1,background:'linear-gradient(135deg,#E91E63,#C2185B)',border:'none',borderRadius:12,padding:'12px 0',fontSize:14,color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:700,opacity:deletingId===confirmDeleteId?0.6:1 }}
              >{deletingId === confirmDeleteId ? '削除中...' : '削除する'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
