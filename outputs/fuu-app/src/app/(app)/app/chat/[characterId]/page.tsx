'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import type { Message } from '@/types'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const characterId = params.characterId as string
  const character = getCharacter(characterId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 最初の挨拶メッセージ
  useEffect(() => {
    if (!character) return
    const greetings: Record<string, string> = {
      aoi:    'こんにちは！あおいだよ〜😊 今日はどんなことあった？なんでも話してね！',
      sakura: 'こんにちは。さくらです。ゆっくりでいいので、今日のこと話してくれる？',
      rika:   'はい来た！りかだよ。今日も何かあったんでしょ？全部吐き出しなよ！',
      natsuko:'おかえり〜。なつこだよ。まあゆっくり座って、今日のこと聞かせてよ。',
      kenji:  'お疲れさま！けんじです。今日も頑張ったね。ゆっくり話して？',
      hiroshi: '...お疲れ。ひろしだ。今日は何があった？',
    }
    const welcome: Message = {
      id: 'welcome',
      conversationId: 'local',
      role: 'assistant',
      content: greetings[characterId] ?? 'こんにちは！今日はどんなことがあった？',
      createdAt: new Date().toISOString(),
    }
    setMessages([welcome])
  }, [characterId, character])

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!character) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>キャラクターが見つかりません</p>
        <button onClick={() => router.push('/app')}>戻る</button>
      </div>
    )
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const newUserMsg: Message = {
      id: Date.now().toString(),
      conversationId: 'local',
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          message: userMessage,
          conversationHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'エラーが発生しました')
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        conversationId: 'local',
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        conversationId: 'local',
        role: 'assistant',
        content: `ごめんね、うまく繋がらなかった…。もう一度話しかけてみて？（${err.message}）`,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const avatarEmoji: Record<string, string> = {
    aoi: '👧', sakura: '🌸', rika: '💪', natsuko: '🍵', kenji: '👨', hiroshi: '🧔',
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: '100dvh', background: '#fdf4f7',
    }}>
      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/app')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E63', padding: 4 }}
        >‹</button>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {avatarEmoji[characterId] ?? '👩'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{character.name}</div>
          <div style={{ fontSize: 11, color: '#E91E63' }}>{character.role}</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12, gap: 8, alignItems: 'flex-end',
            }}
          >
            {/* AIアバター */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {avatarEmoji[characterId] ?? '👩'}
              </div>
            )}

            {/* バブル */}
            <div style={{
              maxWidth: '72%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg,#E91E63,#C2185B)'
                : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              fontSize: 14,
              lineHeight: 1.7,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* タイピングインジケーター */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {avatarEmoji[characterId] ?? '👩'}
            </div>
            <div style={{
              background: '#fff', borderRadius: '18px 18px 18px 4px',
              padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#F48FB1',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={{
        background: '#fff', borderTop: '1px solid #FCE4EC',
        padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${character.name}に話しかける…`}
          rows={1}
          style={{
            flex: 1, border: '1.5px solid #F48FB1', borderRadius: 20,
            padding: '10px 16px', fontSize: 14, outline: 'none',
            background: '#fdf4f7', resize: 'none', lineHeight: 1.5,
            maxHeight: 100, overflowY: 'auto',
            fontFamily: 'inherit',
          }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 100) + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: input.trim() && !loading
              ? 'linear-gradient(135deg,#E91E63,#C2185B)'
              : '#F8BBD9',
            color: '#fff', fontSize: 18, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          ↑
        </button>
      </div>

      {/* タイピングアニメーション CSS */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
