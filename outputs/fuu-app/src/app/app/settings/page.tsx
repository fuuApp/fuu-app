'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NICKNAME_KEY = 'fuu_nickname'
const NICKNAME_SET_KEY = 'fuu_nickname_set'
const SESSION_CONFIRMED_KEY = 'fuu_nickname_confirmed'

export default function SettingsPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(NICKNAME_KEY) ?? ''
    setNickname(saved)
    setNicknameInput(saved)
  }, [])

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim()
    localStorage.setItem(NICKNAME_KEY, trimmed)
    localStorage.setItem(NICKNAME_SET_KEY, 'true')
    // セッション確認もリセット → 次回チャット時に新しい名前で確認される
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname(trimmed)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleClearNickname = () => {
    localStorage.removeItem(NICKNAME_KEY)
    localStorage.removeItem(NICKNAME_SET_KEY)
    sessionStorage.removeItem(SESSION_CONFIRMED_KEY)
    setNickname('')
    setNicknameInput('')
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      background: '#fdf4f7', minHeight: '100dvh',
    }}>
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
        <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>設定</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 保存完了トースト */}
        {saved && (
          <div style={{
            background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12,
            padding: '10px 16px', fontSize: 13, color: '#2E7D32', textAlign: 'center',
          }}>
            ✅ 保存しました
          </div>
        )}

        {/* ニックネームセクション */}
        <div style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #FCE4EC',
            fontSize: 12, color: '#E91E63', fontWeight: 700, letterSpacing: '0.05em',
          }}>
            呼び名
          </div>

          {editing ? (
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                AIたちが会話の中で呼ぶ名前です。本名でなくてOK。
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNickname()}
                  placeholder="例：ゆいちゃん、まーちゃん..."
                  maxLength={20}
                  autoFocus
                  style={{
                    flex: 1, border: '1.5px solid #F48FB1', borderRadius: 20,
                    padding: '10px 16px', fontSize: 14, outline: 'none',
                    background: '#fdf4f7', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSaveNickname}
                  style={{
                    background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                    border: 'none', borderRadius: 20, padding: '10px 18px',
                    fontSize: 13, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: 700,
                  }}
                >保存</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setEditing(false); setNicknameInput(nickname) }}
                  style={{
                    background: 'none', border: '1px solid #ddd', borderRadius: 20,
                    padding: '6px 14px', fontSize: 12, color: '#888',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >キャンセル</button>
                {nickname && (
                  <button
                    onClick={handleClearNickname}
                    style={{
                      background: 'none', border: '1px solid #FFCDD2', borderRadius: 20,
                      padding: '6px 14px', fontSize: 12, color: '#E57373',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >呼び名をなしにする</button>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 16, color: nickname ? '#333' : '#aaa', fontWeight: nickname ? 600 : 400 }}>
                  {nickname || '未設定（「あなた」と呼ばれます）'}
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: '#FCE4EC', border: 'none', borderRadius: 16,
                  padding: '6px 14px', fontSize: 13, color: '#E91E63',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >変更</button>
            </div>
          )}
        </div>

        {/* プランセクション */}
        <div style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #FCE4EC',
            fontSize: 12, color: '#E91E63', fontWeight: 700, letterSpacing: '0.05em',
          }}>
            現在のプラン
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{
                background: 'linear-gradient(135deg,#E91E63,#C2185B)',
                color: '#fff', borderRadius: 20, padding: '4px 12px',
                fontSize: 12, fontWeight: 700,
              }}>
                無料トライアル中
              </span>
              <span style={{ fontSize: 12, color: '#aaa' }}>10日間</span>
            </div>
            <p style={{ fontSize: 13, color: '#888', margin: '8px 0 0', lineHeight: 1.7 }}>
              トライアル終了後は月額プランへ。<br />
              いつでもキャンセルできます。
            </p>
            <button style={{
              marginTop: 12, background: 'none', border: '1px solid #F48FB1',
              borderRadius: 20, padding: '8px 16px', fontSize: 13,
              color: '#E91E63', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              プランを見る →
            </button>
          </div>
        </div>

        {/* アカウントセクション */}
        <div style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #FCE4EC',
            fontSize: 12, color: '#E91E63', fontWeight: 700, letterSpacing: '0.05em',
          }}>
            アカウント
          </div>
          {[
            { label: '利用規約', href: '/terms' },
            { label: 'プライバシーポリシー', href: '/privacy' },
            { label: '特定商取引法に基づく表記', href: '/tokusho' },
          ].map((item, i) => (
            <a key={i} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderBottom: '1px solid #fdf4f7',
                fontSize: 14, color: '#555', textDecoration: 'none',
              }}
            >
              {item.label}
              <span style={{ color: '#ccc', fontSize: 16 }}>›</span>
            </a>
          ))}
          <button
            onClick={() => {
              // Supabase設定後はここでsupabase.auth.signOut()を呼ぶ
              router.push('/login')
            }}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none',
              fontSize: 14, color: '#E57373', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            ログアウト
          </button>
        </div>

        {/* バージョン */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 8 }}>
          fuu ふぅ v1.0.0
        </p>
      </div>
    </div>
  )
}
