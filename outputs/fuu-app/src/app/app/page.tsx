'use client'

import Link from 'next/link'
import { getAllCharacters } from '@/lib/characters'

export default function CharacterSelectPage() {
  const characters = getAllCharacters().filter(c => c.isAvailable)

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>🌸</span>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#E91E63' }}>fuu ふぅ</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>話したいコを選んでね</span>
        <Link href="/app/settings" style={{
          marginLeft: 12, fontSize: 20, textDecoration: 'none', lineHeight: 1,
          color: '#bbb',
        }} title="設定">⚙️</Link>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 20, textAlign: 'center' }}>
          今日は誰に話す？
        </p>

        {characters.map(c => (
          <Link
            key={c.id}
            href={`/app/chat/${c.id}`}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
          >
            <div style={{
              background: '#fff',
              borderRadius: 18,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 10px rgba(233,30,99,0.08)',
              border: '1.5px solid transparent',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#F48FB1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              {/* アバター */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: c.isPremium
                  ? 'linear-gradient(135deg,#C2185B,#880E4F)'
                  : 'linear-gradient(135deg,#E91E63,#F48FB1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, color: '#fff',
              }}>
                {c.id === 'aoi' ? '👧' : c.id === 'sakura' ? '🌸' : c.id === 'rika' ? '💪' : c.id === 'natsuko' ? '🍵' : c.id === 'kenji' ? '👨' : '🧔'}
              </div>

              {/* テキスト */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>{c.age}歳</span>
                  {c.isPremium && (
                    <span style={{
                      fontSize: 10, background: 'linear-gradient(135deg,#C2185B,#880E4F)',
                      color: '#fff', padding: '2px 8px', borderRadius: 20,
                    }}>プレミアム</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#E91E63', marginBottom: 3 }}>
                  {c.role}
                </div>
                <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
                  {c.speechStyle.split('。')[0]}
                </div>
              </div>

              <span style={{ fontSize: 18, color: '#F48FB1' }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
