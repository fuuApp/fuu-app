'use client'

/**
 * 愚痴ジャーナル（宝箱）ページ /app/journal
 *
 * 過去の「愚痴お片付け」結果を日付順に表示する。
 * - Supabase接続時: guchi_journals テーブルから取得
 * - デモモード: セッションストレージのデータを表示（ローカル会話時）
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Journal {
  id: string
  date: string           // YYYY-MM-DD
  reframed: string       // 宝箱テキスト
  originalContent?: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadJournals() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Supabase から取得
          const { data } = await supabase
            .from('guchi_journals')
            .select('id, date, reframed, original_content')
            .order('date', { ascending: false })
            .limit(30)

          if (data && data.length > 0) {
            setJournals(data.map(d => ({
              id: d.id,
              date: d.date,
              reframed: d.reframed,
              originalContent: d.original_content,
            })))
            setLoading(false)
            return
          }
        }

        // デモモード: セッションストレージから取得
        // チャットページで "愚痴お片付け" を実行した結果を保存する形式
        const demoData: Journal[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key?.startsWith('fuu_guchi_')) {
            try {
              const entry = JSON.parse(sessionStorage.getItem(key) ?? '{}')
              if (entry.reframed && entry.date) {
                demoData.push({ id: key, date: entry.date, reframed: entry.reframed })
              }
            } catch { /* ignore */ }
          }
        }
        demoData.sort((a, b) => b.date.localeCompare(a.date))
        setJournals(demoData)
      } catch {
        // エラー時は空リスト
      } finally {
        setLoading(false)
      }
    }

    loadJournals()
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100dvh' }}>
      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/app')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E63', padding: 4 }}
        >‹</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>🧹 愚痴の宝箱</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>気持ちを変換した記録</div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* 説明 */}
        <div style={{
          background: 'linear-gradient(135deg,#FFF0F5,#FCE4EC)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 20,
          border: '1px solid #F8BBD9',
        }}>
          <div style={{ fontSize: 13, color: '#880E4F', fontWeight: 700, marginBottom: 6 }}>
            ✨ 宝箱って何？
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            その日話した愚痴や気持ちを、AIがポジティブな「宝箱」に変換して保存したものです。<br />
            見返すたびに、あなたが頑張っていたことを思い出せます。
          </div>
        </div>

        {/* ロード中 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14 }}>読み込み中...</div>
          </div>
        )}

        {/* 空の状態 */}
        {!loading && journals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🧺</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              まだ宝箱はありません
            </div>
            <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.7, marginBottom: 24 }}>
              AIのママ友と話して、「そろそろ終わりにする」<br />
              ボタンを押すと宝箱が作られます
            </div>
            <button
              onClick={() => router.push('/app')}
              style={{
                background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                border: 'none', borderRadius: 24, padding: '12px 28px',
                fontSize: 14, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: 700,
              }}
            >
              話しに行く →
            </button>
          </div>
        )}

        {/* ジャーナルリスト */}
        {!loading && journals.map((journal, index) => (
          <div
            key={journal.id}
            style={{
              background: '#fff', borderRadius: 18, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(233,30,99,0.07)',
              overflow: 'hidden',
            }}
          >
            {/* 日付バー */}
            <div
              onClick={() => setExpandedId(expandedId === journal.id ? null : journal.id)}
              style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', cursor: 'pointer',
                borderBottom: expandedId === journal.id ? '1px solid #FCE4EC' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: index === 0 ? 'linear-gradient(135deg,#E91E63,#F48FB1)' : '#FCE4EC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  ✨
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
                    {formatDate(journal.date)}の宝箱
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{journal.date}</div>
                </div>
              </div>
              <span style={{ fontSize: 16, color: '#ccc', transition: 'transform 0.2s', transform: expandedId === journal.id ? 'rotate(90deg)' : 'rotate(0)' }}>›</span>
            </div>

            {/* 宝箱テキスト */}
            <div style={{
              padding: expandedId === journal.id ? '16px' : '0 16px',
              maxHeight: expandedId === journal.id ? 400 : 60,
              overflow: 'hidden',
              transition: 'all 0.25s ease',
            }}>
              <div style={{
                fontSize: 14, color: '#555', lineHeight: 1.8,
                background: expandedId === journal.id ? '#FFF0F5' : 'transparent',
                borderRadius: 12,
                padding: expandedId === journal.id ? 14 : '8px 0',
                borderLeft: expandedId === journal.id ? '3px solid #E91E63' : 'none',
                paddingLeft: expandedId === journal.id ? 14 : 0,
              }}>
                {journal.reframed}
              </div>
            </div>
          </div>
        ))}

        {/* ページ下部の余白 */}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
