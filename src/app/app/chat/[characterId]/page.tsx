'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import { useBgm } from '@/hooks/useBgm'
import type { Message } from '@/types'

const NICKNAME_KEY = 'fuu_nickname'
const NICKNAME_SET_KEY = 'fuu_nickname_set'
const SESSION_CONFIRMED_KEY = 'fuu_nickname_confirmed' // sessionStorage: このセッションで確認済み

type NicknamePhase = 'asking' | 'confirming' | 'done'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const characterId = params.characterId as string
  const character = getCharacter(characterId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [guchiDone, setGuchiDone] = useState(false)
  const [guchiSummary, setGuchiSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  const [nickname, setNickname] = useState('')
  const [nicknamePhase, setNicknamePhase] = useState<NicknamePhase>('done')
  const [nicknameInput, setNicknameInput] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nicknameInputRef = useRef<HTMLInputElement>(null)

  const { startBgm } = useBgm()

  const quickReplies = ['今日しんどかった', 'ただ聞いてほしい', '子どものこと', '旦那のこと']
  const showGuchiFooterButton = nicknamePhase === 'done' && !guchiDone && !loadingSummary && !loading

  const avatarEmoji: Record<string, string> = {
    aoi: '👧', sakura: '🌸', rika: '💪', natsuko: '🍵', kenji: '👨', hiroshi: '🧔',
  }

  // キャラごとのセリフ定義
  const nicknameGreetings: Record<string, string> = {
    aoi:     'こんにちは！あおいだよ〜😊 ねえねえ、なんて呼べばいい？',
    sakura:  'こんにちは。さくらです。なんてお呼びすればいい？',
    rika:    'はい来た！りかだよ。なんて呼べばいいの？',
    natsuko: 'おかえり〜。なつこだよ。なんて呼べばいいか教えてくれる？',
    kenji:   'お疲れさま！けんじだよ。なんて呼べばいい？',
    hiroshi: '...ひろしだ。名前、教えてくれるか？',
  }

  const confirmGreetings: Record<string, (name: string) => string> = {
    aoi:     (n) => `おかえり！前回${n}って呼んでたけど、そのままでいい？変えたいなら送って！`,
    sakura:  (n) => `おかえりなさい。前回${n}って呼んでいたけど、そのままで大丈夫？`,
    rika:    (n) => `前回${n}って呼んでたよね。そのままでいい？変えたいなら言って。`,
    natsuko: (n) => `おかえり〜。前回${n}って呼んでたけど、そのままでいいかしら？`,
    kenji:   (n) => `お疲れさま！前回${n}って呼んでたけど、そのままでいい？`,
    hiroshi: (n) => `...前回${n}って呼んでたな。そのままでいいか？`,
  }

  const normalGreetings: Record<string, string> = {
    aoi:     '今日はどんなことあった？なんでも話してね！',
    sakura:  '今日のこと、ゆっくり話してくれる？',
    rika:    '今日も何かあったんでしょ？全部吐き出しなよ！',
    natsuko: 'まあゆっくり座って、今日のこと聞かせてよ。',
    kenji:   '今日も頑張ったね。どんなことあった？',
    hiroshi: '今日は何があった？',
  }

  // チャット開始時の初期化
  const startNormalChat = (name: string) => {
    const greeting = normalGreetings[characterId] ?? '今日はどんなことがあった？'
    const prefix = name ? `${name}、` : ''
    setMessages([{
      id: 'welcome',
      conversationId: 'local',
      role: 'assistant',
      content: `${prefix}${greeting}`,
      createdAt: new Date().toISOString(),
    }])
    setShowQuickReplies(true)
    setNicknamePhase('done')
    sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true')
  }

  useEffect(() => {
    if (!character) return

    const savedNickname = localStorage.getItem(NICKNAME_KEY) ?? ''
    const isSet = localStorage.getItem(NICKNAME_SET_KEY) === 'true'
    const sessionConfirmed = sessionStorage.getItem(SESSION_CONFIRMED_KEY) === 'true'

    setNickname(savedNickname)
    setGuchiDone(false)
    setGuchiSummary('')

    if (!isSet) {
      // 初回 → ニックネームを聞く
      setNicknamePhase('asking')
      setMessages([{
        id: 'welcome', conversationId: 'local', role: 'assistant',
        content: nicknameGreetings[characterId] ?? 'なんて呼べばいい？',
        createdAt: new Date().toISOString(),
      }])
    } else if (!sessionConfirmed) {
      // 2回目以降・新セッション → 呼び名を確認
      const displayName = savedNickname || 'あなた'
      const confirmMsg = confirmGreetings[characterId]
        ? confirmGreetings[characterId](displayName)
        : `前回${displayName}って呼んでたけど、そのままでいい？`
      setNicknamePhase('confirming')
      setMessages([{
        id: 'welcome', conversationId: 'local', role: 'assistant',
        content: confirmMsg,
        createdAt: new Date().toISOString(),
      }])
    } else {
      // 同セッション内 → そのまま通常チャット
      startNormalChat(savedNickname)
    }
  }, [characterId, character])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, guchiSummary])

  useEffect(() => {
    if (nicknamePhase === 'asking' || nicknamePhase === 'confirming') {
      nicknameInputRef.current?.focus()
    }
  }, [nicknamePhase])

  if (!character) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>キャラクターが見つかりません</p>
        <button onClick={() => router.push('/app')}>戻る</button>
      </div>
    )
  }

  // ニックネームを確定（初回・変更共通）
  const handleNicknameSubmit = (name: string) => {
    const trimmed = name.trim()
    localStorage.setItem(NICKNAME_KEY, trimmed)
    localStorage.setItem(NICKNAME_SET_KEY, 'true')
    setNickname(trimmed)

    const greeting = normalGreetings[characterId] ?? '今日はどんなことがあった？'
    const confirmReply = trimmed
      ? `${trimmed}って呼ぶね😊 ${greeting}`
      : greeting

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(), conversationId: 'local', role: 'user',
        content: trimmed || '（スキップ）',
        createdAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 1).toString(), conversationId: 'local', role: 'assistant',
        content: confirmReply,
        createdAt: new Date().toISOString(),
      },
    ])
    setShowQuickReplies(true)
    setNicknamePhase('done')
    sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true')
  }

  // 呼び名そのままでOK
  const handleNicknameKeep = () => {
    startNormalChat(nickname)
  }

  // 呼び名を変更（confirmingフェーズで新しい名前を入力）
  const handleNicknameChange = (newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) {
      handleNicknameKeep()
      return
    }
    localStorage.setItem(NICKNAME_KEY, trimmed)
    setNickname(trimmed)

    const greeting = normalGreetings[characterId] ?? '今日はどんなことがあった？'
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(), conversationId: 'local', role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 1).toString(), conversationId: 'local', role: 'assistant',
        content: `${trimmed}って呼ぶね😊 ${greeting}`,
        createdAt: new Date().toISOString(),
      },
    ])
    setShowQuickReplies(true)
    setNicknamePhase('done')
    sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true')
  }

  const handleSend = async (messageText?: string) => {
    const userMessage = (messageText ?? input).trim()
    if (!userMessage || loading) return
    setInput('')
    setShowQuickReplies(false)
    setLoading(true)

    // ユーザー操作後にBGMを開始（初回のみ。ブラウザの自動再生ポリシー対応）
    startBgm()

    const newUserMsg: Message = {
      id: Date.now().toString(), conversationId: 'local',
      role: 'user', content: userMessage,
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
          nickname: nickname || undefined,
          conversationHistory: updatedMessages.map(m => ({
            role: m.role, content: m.content,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), conversationId: 'local',
        role: 'assistant', content: data.message,
        createdAt: new Date().toISOString(),
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), conversationId: 'local',
        role: 'assistant',
        content: `ごめんね、うまく繋がらなかった…。もう一度話しかけてみて？（${err.message}）`,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // JSTの今日の日付を YYYY-MM-DD で返す
  const getTodayJST = (): string => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // UTC+9
    return now.toISOString().split('T')[0]
  }

  const handleGuchi = async () => {
    setLoadingSummary(true)
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          message: `【愚痴お片付けモード】今日の会話を振り返って、ユーザーが感じていた気持ちを3つの絵文字と一言でまとめてください。形式：\n💭 [感情1]\n💭 [感情2]\n💭 [感情3]\n\nそして最後に一言で締めてください。全体100文字以内。\n\n今日の内容：\n${userMessages}`,
          conversationHistory: [],
        }),
      })
      const data = await res.json()
      const summary = res.ok ? data.message : 'ゆっくり休んでね。今日もよく頑張ったよ。'
      setGuchiSummary(summary)
      setGuchiDone(true)

      // ── sessionStorage に保存（ジャーナルページのデモ表示用） ──
      try {
        const today = getTodayJST()
        const key = `fuu_guchi_${today}`
        sessionStorage.setItem(key, JSON.stringify({
          date: today,
          reframed: summary,
        }))
      } catch { /* ストレージ制限などは無視 */ }

    } catch {
      const fallback = '今日もたくさん話してくれてありがとう。ゆっくり休んでね。'
      setGuchiSummary(fallback)
      setGuchiDone(true)
      try {
        const today = getTodayJST()
        sessionStorage.setItem(`fuu_guchi_${today}`, JSON.stringify({ date: today, reframed: fallback }))
      } catch { /* ignore */ }
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
        <button onClick={() => router.push('/app')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E63', padding: 4 }}>‹</button>
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
        {nickname && (
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#bbb' }}>{nickname}</div>
        )}
        <div style={{ marginLeft: nickname ? 8 : 'auto', width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {messages.map(msg => (
          msg.content === '（スキップ）' ? null : (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12, gap: 8, alignItems: 'flex-end',
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {avatarEmoji[characterId] ?? '👩'}
                </div>
              )}
              <div style={{
                maxWidth: '72%', padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg,#E91E63,#C2185B)' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: 14, lineHeight: 1.7,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          )
        ))}

        {(loading || loadingSummary) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {avatarEmoji[characterId] ?? '👩'}
            </div>
            <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
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

        {/* 愚痴お片付け結果 */}
        {guchiDone && guchiSummary && (() => {
          // AIの出力を感情ラベル行と締めの一言に分割してパース
          const lines = guchiSummary.split('\n').map(l => l.trim()).filter(Boolean)
          const labelLines = lines.filter(l => l.startsWith('💭'))
          const closingLines = lines.filter(l => !l.startsWith('💭'))
          const labels = labelLines.map(l => l.replace(/^💭\s*/, ''))
          const closing = closingLines.join(' ')
          return (
          <div style={{
            margin: '16px 0', background: 'linear-gradient(135deg,#FFF0F5,#FCE4EC)',
            borderRadius: 20, padding: '18px 20px',
            border: '1.5px solid #F48FB1', boxShadow: '0 2px 12px rgba(233,30,99,0.1)',
          }}>
            <div style={{ fontSize: 13, color: '#E91E63', fontWeight: 700, marginBottom: 12 }}>
              🧹 今日の気持ち、お片付けできたよ
            </div>
            {/* 感情ラベル：タグ形式（クリック不可） */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {labels.map((label, i) => (
                <span key={i} style={{
                  background: '#fff', border: '1.5px solid #F48FB1',
                  borderRadius: 20, padding: '6px 14px',
                  fontSize: 13, color: '#C2185B',
                  display: 'inline-block', userSelect: 'none',
                }}>
                  {label}
                </span>
              ))}
            </div>
            {/* 締めの一言 */}
            {closing && (
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, borderTop: '1px solid #F8BBD9', paddingTop: 12 }}>
                {closing}
              </div>
            )}
            <button onClick={() => {
              setGuchiDone(false); setGuchiSummary('')
              const again: Record<string, string> = {
                aoi: 'またいつでも話しかけてね😊', sakura: 'またゆっくり話しましょう。',
                rika: 'またいつでも来なよ！', natsuko: 'またね〜。ゆっくり休んでね。',
                kenji: 'また話しかけてね。', hiroshi: '...また話しかけてくれ。',
              }
              setMessages([{
                id: Date.now().toString(), conversationId: 'local', role: 'assistant',
                content: again[characterId] ?? 'またね！',
                createdAt: new Date().toISOString(),
              }])
              setShowQuickReplies(true)
            }} style={{
              marginTop: 12, background: 'none', border: '1px solid #F48FB1',
              borderRadius: 16, padding: '6px 16px', fontSize: 12,
              color: '#E91E63', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              もう一度話す
            </button>
          </div>
          )
        })()}

        <div ref={bottomRef} />
      </div>

      {/* ── ニックネーム入力エリア（asking / confirming） ── */}
      {(nicknamePhase === 'asking' || nicknamePhase === 'confirming') && (
        <div style={{
          background: '#fff', borderTop: '1px solid #FCE4EC',
          padding: '12px 16px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              ref={nicknameInputRef}
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && nicknameInput.trim()) {
                  nicknamePhase === 'asking'
                    ? handleNicknameSubmit(nicknameInput)
                    : handleNicknameChange(nicknameInput)
                  setNicknameInput('')
                }
              }}
              placeholder={nicknamePhase === 'confirming' ? '新しいニックネームを入力…' : 'ニックネームを入力…'}
              maxLength={20}
              style={{
                flex: 1, border: '1.5px solid #F48FB1', borderRadius: 20,
                padding: '10px 16px', fontSize: 14, outline: 'none',
                background: '#fdf4f7', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => {
                if (!nicknameInput.trim()) return
                nicknamePhase === 'asking'
                  ? handleNicknameSubmit(nicknameInput)
                  : handleNicknameChange(nicknameInput)
                setNicknameInput('')
              }}
              disabled={!nicknameInput.trim()}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: nicknameInput.trim() ? 'linear-gradient(135deg,#E91E63,#C2185B)' : '#F8BBD9',
                color: '#fff', fontSize: 18,
                cursor: nicknameInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >↑</button>
          </div>

          {/* asking: スキップ / confirming: このままでいい */}
          {nicknamePhase === 'asking' ? (
            <button onClick={() => { handleNicknameSubmit(''); setNicknameInput('') }}
              style={{ background: 'none', border: 'none', fontSize: 12, color: '#bbb', cursor: 'pointer', padding: '0 4px' }}>
              スキップ（名前なしで始める）
            </button>
          ) : (
            <button onClick={handleNicknameKeep}
              style={{
                background: '#FCE4EC', border: '1px solid #F48FB1',
                borderRadius: 16, padding: '6px 16px', fontSize: 13,
                color: '#E91E63', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              このままでいい
            </button>
          )}
        </div>
      )}

      {/* クイック返信 */}
      {nicknamePhase === 'done' && showQuickReplies && !loading && (
        <div style={{
          padding: '8px 12px 4px',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          background: '#fdf4f7',
        }}>
          {quickReplies.map(reply => (
            <button key={reply} onClick={() => handleSend(reply)} style={{
              background: '#fff', border: '1.5px solid #F48FB1', borderRadius: 20,
              padding: '7px 14px', fontSize: 13, color: '#E91E63',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FCE4EC' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >{reply}</button>
          ))}
        </div>
      )}

      {/* 通常入力エリア */}
      {nicknamePhase === 'done' && (
        <div style={{
          background: '#fff', borderTop: '1px solid #FCE4EC',
          paddingBottom: 4, flexShrink: 0,
        }}>
          {/* 入力行 */}
          <div style={{ padding: '10px 12px 6px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
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
                maxHeight: 100, overflowY: 'auto', fontFamily: 'inherit',
              }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 100) + 'px'
              }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: input.trim() && !loading ? 'linear-gradient(135deg,#E91E63,#C2185B)' : '#F8BBD9',
              color: '#fff', fontSize: 18,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}>↑</button>
          </div>

          {/* そろそろ終わりにするボタン */}
          {showGuchiFooterButton && (
            <div style={{ textAlign: 'center', paddingBottom: 10 }}>
              <button onClick={handleGuchi} style={{
                background: 'none', border: 'none',
                fontSize: 12, color: '#bbb', cursor: 'pointer',
                fontFamily: 'inherit', padding: '2px 8px',
                textDecoration: 'underline', textDecorationColor: '#e0c0cc',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E91E63' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#bbb' }}
              >
                🧹 そろそろ終わりにする
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
