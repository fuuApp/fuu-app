'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Journal { id: string; date: string; reframed: string; originalContent?: string }

function formatDate(dateStr: string): string {
  // "YYYY-MM-DD" をローカル時刻として解釈（UTCとして解釈するとJST+9で-1日になる）
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

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data } = await supabase.from('guchi_journals').select('id,date,reframed,original_content').order('date',{ascending:false}).limit(30)
          if (data && data.length>0) { setJournals(data.map(d=>({id:d.id,date:d.date,reframed:d.reframed,originalContent:d.original_content}))); setLoading(false); return }
        }
        const demo: Journal[] = []
        for (let i=0; i<sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key?.startsWith('fuu_guchi_')) { try { const e=JSON.parse(sessionStorage.getItem(key)??'{}'); if (e.reframed&&e.date) demo.push({id:key,date:e.date,reframed:e.reframed}) } catch {} }
        }
        demo.sort((a,b)=>b.date.localeCompare(a.date)); setJournals(demo)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

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
            <div onClick={()=>setExpandedId(expandedId===journal.id?null:journal.id)} style={{ padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderBottom:expandedId===journal.id?'1px solid #FCE4EC':'none' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:index===0?'linear-gradient(135deg,#E91E63,#F48FB1)':'#FCE4EC',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>✨</div>
                <div><div style={{ fontSize:14,fontWeight:700,color:'#333' }}>{formatDate(journal.date)}の気持ちの箱</div><div style={{ fontSize:11,color:'#aaa' }}>{journal.date}</div></div>
              </div>
              <span style={{ fontSize:16,color:'#ccc',transition:'transform 0.2s',transform:expandedId===journal.id?'rotate(90deg)':'rotate(0)' }}>›</span>
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
    </div>
  )
}
