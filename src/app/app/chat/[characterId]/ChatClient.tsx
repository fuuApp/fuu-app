'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import { useBgm } from '@/hooks/useBgm'
import { createClient } from '@/lib/supabase'
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
  const [soudanDone, setSoudanDone] = useState(false)
  const [soudanSummary, setSoudanSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  const [nickname, setNickname] = useState('')
  const [nicknamePhase, setNicknamePhase] = useState<NicknamePhase>('done')
  const [nicknameInput, setNicknameInput] = useState('')

  // チャットモード
  const [chatMode, setChatMode] = useState<'guchi' | 'soudan' | 'hybrid'>('guchi')
  const [showSoudanReplies, setShowSoudanReplies] = useState(false)
  const [showAlternativeReplies, setShowAlternativeReplies] = useState(false) // ④⑤⑥追加提案後
  const [inputFocused, setInputFocused] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  // refで最新値を保持（handleSend時に非同期タイミングのズレを防ぐ）
  const journalContextRef = useRef<string>('')

  const [userPlan, setUserPlan] = useState<'trial' | 'standard' | 'premium'>('trial')

  // 残り会話回数
  const [remaining, setRemaining] = useState<number | null>(null)
  const [ticketActive, setTicketActive] = useState(false)

  // ブロック理由（トライアル終了 / 上限超過）
  const [blockedCode, setBlockedCode] = useState<'TRIAL_EXPIRED' | 'LIMIT_EXCEEDED' | null>(null)

  // 過去の気持ちの箱（直近3件）→ systemPromptに差し込む
  const [journalContext, setJournalContext] = useState<string>('')
  // journal fetchが完了するまで送信をブロック
  const [journalLoaded, setJournalLoaded] = useState(false)

  const { startBgm } = useBgm()

  const quickReplies = ['今日しんどかった', 'ただ聞いてほしい', '子どものこと', '旦那のこと', 'ママ友のこと', '困っていること']
  // ユーザー発言が1件以上ある場合のみ表示（スキップは除く）
  const userMessageCount = messages.filter(m => m.role === 'user' && m.content !== '（スキップ）').length
  const showGuchiFooterButton = nicknamePhase === 'done' && !guchiDone && !loadingSummary && !loading && chatMode === 'guchi' && userMessageCount > 0
  const showSoudanFooterButton = nicknamePhase === 'done' && !soudanDone && !loadingSummary && !loading && chatMode === 'soudan' && userMessageCount > 0

  // キャラクターアバター（/public/characters/ に画像を配置すること）
  const avatarHasImage = character?.avatar && character.avatar !== ''
  const avatarStyle: React.CSSProperties = {
    width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
  }
  const avatarFallback: Record<string, string> = {
    aoi: '👧', sakura: '🌸', rika: '💪', natsuko: '🍵', kenji: '👨', hiroshi: '🧔',
  }

  // キャラごとのセリフ定義
  const nicknameGreetings: Record<string, string> = {
    // 既存6体
    aoi:     'こんにちは！あおいだよ〜😊 ねえねえ、なんて呼べばいい？',
    sakura:  'こんにちは。さくらです。なんてお呼びすればいい？',
    rika:    'はい来た！りかだよ。なんて呼べばいいの？',
    natsuko: 'おかえり〜。なつこだよ。なんて呼べばいいか教えてくれる？',
    kenji:   'お疲れさま！けんじだよ。なんて呼べばいい？',
    hiroshi: '...ひろしだ。名前、教えてくれるか？',
    // 追加16体
    yui:     'はじめまして！ゆいだよ〜😊 えっと、なんて呼べばいい？',
    mio:     '…みおだよ。なんて呼べばいい？',
    haruka:  'こんにちは！はるかだよ。なんて呼べばいいかな？',
    tomomi:  'ともみだよ。なんて呼べばいい？',
    ayaka:   'あやかだよ〜。よろしくね。なんて呼べばいいかな？',
    noriko:  'こんにちは、のりこだよ。なんて呼べばいいかな？',
    kazuko:  'かずこだよ。なんて呼べばいいかな？',
    michiko: 'みちこだよ。よろしくね。なんて呼べばいいかな？',
    yoko:    'ようこだよ。なんて呼べばいいかな？',
    akiko:   'あきこだよ！よろしくね😊 なんて呼べばいいかな？',
    reiko:   'れいこだよ！よろしく😊 なんて呼べばいいかな？',
    sota:    'そうただよ。なんて呼べばいい？',
    takashi: 'たかしだ。なんて呼べばいい？',
    daisuke: 'だいすけだよ！よろしく笑 なんて呼べばいい？',
    yusuke:  'ゆうすけだよ。なんて呼べばいいかな？',
    koji:    '…こうじだ。なんて呼べばいい？',
  }

  const confirmGreetings: Record<string, (name: string) => string> = {
    // 既存6体
    aoi:     (n) => `おかえり！前回${n}って呼んでたけど、そのままでいい？変えたいなら送って！`,
    sakura:  (n) => `おかえりなさい。前回${n}って呼んでいたけど、そのままで大丈夫？`,
    rika:    (n) => `前回${n}って呼んでたよね。そのままでいい？変えたいなら言って。`,
    natsuko: (n) => `おかえり〜。前回${n}って呼んでたけど、そのままでいいかしら？`,
    kenji:   (n) => `お疲れさま！前回${n}って呼んでたけど、そのままでいい？`,
    hiroshi: (n) => `...前回${n}って呼んでたな。そのままでいいか？`,
    // 追加16体
    yui:     (n) => `おかえり！前回${n}って呼んでたよね、そのままでいい？変えたいなら送ってね！`,
    mio:     (n) => `前回${n}って呼んでたよね。そのままでいい？`,
    haruka:  (n) => `また来てくれたんだね！前回${n}って呼んでたけど、そのままでいい？`,
    tomomi:  (n) => `おかえり！前回${n}だったよね。そのままでいい？`,
    ayaka:   (n) => `おかえり〜！前回${n}って呼んでたよ。そのままでいい？`,
    noriko:  (n) => `前回${n}って呼んでたけど、そのままでいい？`,
    kazuko:  (n) => `おかえり。前回${n}って呼んでたけど、そのままでいい？`,
    michiko: (n) => `おかえり。前回${n}って呼んでたよ。そのままでいい？`,
    yoko:    (n) => `おかえり！前回${n}って呼んでたよね。そのままでいい？`,
    akiko:   (n) => `おかえり！前回${n}って呼んでたよ。そのままでいい？`,
    reiko:   (n) => `おかえり！前回${n}って呼んでたよ。そのままでいい？`,
    sota:    (n) => `前回${n}って呼んでたよな。そのままでいい？`,
    takashi: (n) => `前回${n}って呼んでたよな。そのままでいいか？`,
    daisuke: (n) => `おかえり！前回${n}って呼んでたけど、そのままでいい？`,
    yusuke:  (n) => `前回${n}って呼んでたよな。そのままでいいか？`,
    koji:    (n) => `前回${n}って呼んでたな。そのままでいいか？`,
  }

  const normalGreetings: Record<string, string> = {
    // 既存6体
    aoi:     '今日はどんなことあった？なんでも話してね！',
    sakura:  '今日のこと、ゆっくり話してくれる？',
    rika:    '今日も何かあったんでしょ？全部吐き出しなよ！',
    natsuko: 'まあゆっくり座って、今日のこと聞かせてよ。',
    kenji:   '今日も頑張ったね。どんなことあった？',
    hiroshi: '今日は何があった？',
    // 追加16体
    yui:     '今日どうだった？なんでも話してほしいな！',
    mio:     '今日のこと、話してみて。',
    haruka:  '今日もいろいろあった？話してみて。',
    tomomi:  '今日は何があった？全部話して。',
    ayaka:   '今日はどんなことあった？',
    noriko:  '今日のこと、話してみて。',
    kazuko:  '今日どうだった？ゆっくり話してね。',
    michiko: '今日のこと、聞かせてくれる？',
    yoko:    '今日はどんなことがあった？なんでも話してね。',
    akiko:   '今日はどんなことあった？',
    reiko:   '今日はどんなことあった？なんでも話してね！',
    sota:    '今日はどうだった？',
    takashi: '今日何があった？',
    daisuke: '今日もいろいろあった感じ？話してよ。',
    yusuke:  '今日どうだった？なんでも話してよ。',
    koji:    '…今日のこと、話してくれ。',
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

    // 気持ちの箱コンテキスト読み込み
    // ① localStorageにあれば同期で即読み込み（高速パス）
    let localHit = false
    try {
      const storedList: Array<{ date: string; reframed: string }> =
        JSON.parse(localStorage.getItem(`fuu_journal_context_list_${characterId}`) || '[]')
      if (storedList.length > 0) {
        const lines = storedList.map(j => `・${j.date}：${j.reframed}`).join('\n')
        setJournalContext(lines)
        journalContextRef.current = lines
        localHit = true
      }
    } catch { /* ignore */ }

    if (localHit) {
      setJournalLoaded(true)  // localStorage命中 → 即完了
    } else {
      // ② localStorage未作成（初回 or 別デバイス）→ DBフォールバック
      // getSession()を使用（getUser()はサーバーRTT必要で遅い）
      ;(async () => {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data } = await supabase
              .from('guchi_journals')
              .select('date, reframed')
              .eq('user_id', session.user.id)
              .eq('character_id', characterId)
              .order('date', { ascending: false })
              .limit(3)
            if (data && data.length > 0) {
              // DBデータをlocalStorageにシード（次回から高速パスを通る）
              try {
                localStorage.setItem(`fuu_journal_context_list_${characterId}`,
                  JSON.stringify(data.map(d => ({ date: d.date, reframed: d.reframed }))))
              } catch { /* ignore */ }
              const lines = data.map((j: { date: string; reframed: string }) =>
                `・${j.date}：${j.reframed}`).join('\n')
              setJournalContext(lines)
              journalContextRef.current = lines
            }
          }
        } catch { /* 取得失敗は無視 */ } finally {
          setJournalLoaded(true)
        }
      })()
    }
  }, [characterId, character])

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, guchiSummary])

  // ── キーボード対策（iOS / Android 共通設計） ─────────────────────────────
  //
  // [iOS WKWebView] キーボードが出ても WebView はリサイズされない
  //   → visualViewport.height で正確な高さを取得し --chat-height に反映
  //   → iOS はキーボード出現でページを上スクロールするため scrollTo(0,0) で打ち消す
  //
  // [Android WebView] キーボードが出ると WebView 自体がリサイズされる
  //   → visualViewport.height も自動縮小するので --chat-height は正しく更新される
  //   → window.scrollY は常に 0 のままなので resetScroll は実質何もしない（無害）
  //   → safe-area-inset-bottom は基本 0 なので paddingBottom 分岐も無害
  //
  // → このコードは iOS/Android/Web ブラウザ すべてで安全に動作する

  useEffect(() => {
    // overflow:hidden でページスクロールを封じる（両OS共通・無害）
    document.documentElement.classList.add('chat-active')
    document.body.classList.add('chat-active')

    // iOS 限定: キーボード表示時にページが強制スクロールされるのを打ち消す
    // Android では scrollY = 0 のまま変化しないため実質ノーオペレーション
    const resetScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' } as ScrollToOptions)
      }
    }
    window.addEventListener('scroll', resetScroll, { passive: true })
    window.visualViewport?.addEventListener('scroll', resetScroll)

    return () => {
      document.documentElement.classList.remove('chat-active')
      document.body.classList.remove('chat-active')
      window.removeEventListener('scroll', resetScroll)
      window.visualViewport?.removeEventListener('scroll', resetScroll)
    }
  }, [])

  // キーボード上端までの高さを --chat-height に反映（iOS/Android 両対応）
  // iOS: WebView はリサイズされないが visualViewport.height は正確な値を返す
  // Android: WebView がリサイズされるため visualViewport.height も自動縮小する
  // → どちらも同じコードで正しく動く
  useEffect(() => {
    const vv = window.visualViewport
    const scrollToBottom = () => {
      const el = messagesContainerRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    const update = () => {
      const h = vv?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--chat-height', `${h}px`)
      // CSS変数反映後（rAF）と、キーボードアニメーション完了後（350ms）の2段階でスクロール
      requestAnimationFrame(scrollToBottom)
      setTimeout(scrollToBottom, 350)
    }
    vv?.addEventListener('resize', update)
    update()
    return () => vv?.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    // iOS でキーボードが自動で開いて挨拶メッセージが見えなくなるため auto-focus を無効化
    // （@capacitor/keyboard の resize:body が有効になれば不要だが、UX上もタップで開始が自然）
    // nicknameInputRef.current?.focus()
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
    if (!userMessage || loading || loadingSummary || !journalLoaded) return
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
          mode: chatMode,
          journalContext: journalContextRef.current || undefined,
          // 現在のメッセージはAPIが別途 message パラメータで受け取るため
          // conversationHistory には「送信前」の履歴（=messages）のみを渡す
          // 「（スキップ）」はUI非表示だがAIには見せない（混乱防止）
          conversationHistory: messages
            .filter(m => m.content !== '（スキップ）')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'TRIAL_EXPIRED' || data.code === 'LIMIT_EXCEEDED') {
          setBlockedCode(data.code)
          return
        }
        if (data.code === 'PLAN_CANCELED') {
          setBlockedCode('TRIAL_EXPIRED') // 解約済み → 同じオーバーレイでプランへ誘導
          return
        }
        throw new Error(data.error || 'エラーが発生しました')
      }

      // 残り会話回数を更新
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      if (typeof data.ticketActive === 'boolean') setTicketActive(data.ticketActive)

      // 愚痴→相談の自動検知でハイブリッドモードに切り替え
      if (data.autoHybrid) {
        setChatMode('soudan')
      }

      // 相談 or ハイブリッドで提案が含まれていたら深掘りボタンを表示
      const hasSoudanOptions = data.message.includes('①') && data.message.includes('②') && data.message.includes('③')
      const hasAlternativeOptions = data.message.includes('④') && data.message.includes('⑤') && data.message.includes('⑥')
      if ((chatMode === 'soudan' || data.autoHybrid) && hasAlternativeOptions) {
        setShowAlternativeReplies(true)
        setShowSoudanReplies(false) // ④⑤⑥が出たら①②③ボタンは隠す
      } else if ((chatMode === 'soudan' || data.autoHybrid) && hasSoudanOptions) {
        setShowSoudanReplies(true)
        setShowAlternativeReplies(false)
      } else {
        setShowSoudanReplies(false)
        setShowAlternativeReplies(false)
      }

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
    // ユーザー発言のみ抽出（AIの発言・スキップは除外）
    const userMessages = messages.filter(m => m.role === 'user' && m.content !== '（スキップ）').map(m => m.content).join('\n')
    // 前回の気持ちの箱がある場合は補足として渡す
    const prevContext = journalContextRef.current
      ? `\n\n【前回の気持ちの箱（参考）】\n${journalContextRef.current}`
      : ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          isGuchiSummary: true,  // キャラ人格を使わない中立サマリーモード
          message: `ユーザーが今日話してくれた内容から、感じていた気持ちを3つの絵文字と一言でまとめてください。形式：\n💭 [感情1]\n💭 [感情2]\n💭 [感情3]\n\nそして最後に一言で締めてください。全体100文字以内。マークダウン記号（**など）は絶対に使わないでください。${prevContext}\n\n【ユーザーが話した内容】\n${userMessages}`,
          conversationHistory: [],
        }),
      })
      const data = await res.json()
      const summary = res.ok ? data.message : '今日もたくさん話してくれてありがとう。ゆっくり休んでね。'
      setGuchiSummary(summary)
      setGuchiDone(true)

      const today = getTodayJST()

      // ── sessionStorage に保存（オフライン/未ログイン時のフォールバック用） ──
      try {
        sessionStorage.setItem(`fuu_guchi_${today}`, JSON.stringify({ date: today, reframed: summary }))
      } catch { /* ignore */ }

      // ── localStorage に直近3件を保存（次回セッションの「前回の続き」機能用） ──
      try {
        const existing: Array<{ date: string; reframed: string }> =
          JSON.parse(localStorage.getItem(`fuu_journal_context_list_${characterId}`) || '[]')
        const updated = [{ date: today, reframed: summary }, ...existing.filter(e => e.date !== today)].slice(0, 3)
        localStorage.setItem(`fuu_journal_context_list_${characterId}`, JSON.stringify(updated))
        // 現セッションのrefも更新（同セッション内に再度送信した場合も最新を使う）
        const lines = updated.map(j => `・${j.date}：${j.reframed}`).join('\n')
        journalContextRef.current = lines
        setJournalContext(lines)
      } catch { /* ignore */ }

      // ── Supabase guchi_journals に保存 ──
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // original_content は保存しない（PP第5条「会話はサーバーに保存されない」との整合性を維持）
          await supabase.from('guchi_journals').upsert(
            { user_id: user.id, date: today, reframed: summary, original_content: '', character_id: characterId },
            { onConflict: 'user_id,date,character_id' }
          )
        }
      } catch { /* DB保存失敗はサイレント。sessionStorageにはある */ }

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

  const handleSoudan = async () => {
    setLoadingSummary(true)
    const userMessages = messages.filter(m => m.role === 'user' && m.content !== '（スキップ）').map(m => m.content).join('\n')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          isGuchiSummary: true,
          message: `ユーザーが今日相談してくれた内容を3つのポイントで整理してください。形式：\n📝 [ポイント1]\n📝 [ポイント2]\n📝 [ポイント3]\n\nそして最後に一言で締めてください。全体100文字以内。マークダウン記号（**など）は絶対に使わないでください。\n\n【ユーザーが相談した内容】\n${userMessages}`,
          conversationHistory: [],
        }),
      })
      const data = await res.json()
      const summary = res.ok ? data.message : '今日はいっぱい相談してくれてありがとう。また話しかけてね。'
      setSoudanSummary(summary)
      setSoudanDone(true)
      setShowSoudanReplies(false)
      setShowAlternativeReplies(false)

      const today = getTodayJST()
      try {
        sessionStorage.setItem(`fuu_soudan_${today}`, JSON.stringify({ date: today, reframed: summary }))
      } catch { /* ignore */ }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('guchi_journals').upsert(
            { user_id: user.id, date: today, reframed: summary, original_content: '', character_id: characterId },
            { onConflict: 'user_id,date,character_id' }
          )
        }
      } catch { /* ignore */ }
    } catch {
      const fallback = '今日はいっぱい相談してくれてありがとう。また話しかけてね。'
      setSoudanSummary(fallback)
      setSoudanDone(true)
      setShowSoudanReplies(false)
      setShowAlternativeReplies(false)
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

  // ── トライアル終了 / 上限超過オーバーレイ ─────────────────────
  if (blockedCode) {
    const isTrialExpired = blockedCode === 'TRIAL_EXPIRED'
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: '#fdf4f7',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '36px 24px',
          textAlign: 'center', boxShadow: '0 4px 24px rgba(233,30,99,0.1)',
          maxWidth: 360, width: '100%',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{isTrialExpired ? '🌸' : '💬'}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 12 }}>
            {isTrialExpired
              ? '無料トライアルが終了しました'
              : userPlan === 'trial'
              ? '無料プランの会話回数に達しました'
              : '今月の会話回数に達しました'}
          </h2>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8, marginBottom: 24 }}>
            {isTrialExpired
              ? 'ふぅとの会話を続けるにはプランを選んでください。いつでも解約できます。'
              : userPlan === 'trial'
              ? '無料プランの会話上限に達しました。プランに登録して会話を続けましょう。'
              : '今月の会話上限に達しました。1日使い放題チケット（¥300）をどうぞ。'}
          </p>
          <button
            onClick={() => router.push('/app/plans')}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg,#E91E63,#C2185B)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer', marginBottom: 12,
            }}
          >
            🌸 プランを選ぶ
          </button>
          <button
            onClick={() => router.push('/app')}
            style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: '#f5f5f5', color: '#888',
              fontWeight: 600, fontSize: 14,
              border: 'none', cursor: 'pointer',
            }}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'var(--chat-height, 100dvh)', background: '#fdf4f7',
    }}>
      {/* ヘッダー（safe-area-inset-top でステータスバー重なり防止） */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <button onClick={() => router.push('/app')}
          style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#E91E63', padding: '8px 8px 8px 0', flexShrink: 0 }}>‹</button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
          background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          flexShrink: 0,
        }}>
          {avatarHasImage
            ? <img src={character.avatar} alt={character.name} style={avatarStyle} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
            : avatarFallback[characterId] ?? '👩'}
        </div>
        {/* キャラ名：flex:1 + minWidth:0 で右要素が押し出されないように */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{character.name}</div>
          <div style={{ fontSize: 11, color: '#E91E63' }}>{character.role}</div>
        </div>
        {/* 右セクション：flexShrink:0 で縮まらないように */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* 残り会話回数バッジ */}
          {remaining !== null && (
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: ticketActive
                ? 'linear-gradient(135deg,#43A047,#2E7D32)'
                : remaining <= 10
                  ? 'linear-gradient(135deg,#F44336,#B71C1C)'
                  : remaining <= 30
                    ? 'linear-gradient(135deg,#FF9800,#E65100)'
                    : '#FCE4EC',
              color: ticketActive || remaining <= 30 ? '#fff' : '#E91E63',
              whiteSpace: 'nowrap',
            }}>
              {ticketActive ? '∞ 使い放題' : `残り${remaining}回`}
            </div>
          )}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }} />
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {messages.map(msg => (
          msg.content === '（スキップ）' ? null : (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12, gap: 8, alignItems: 'flex-end',
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {avatarHasImage
                    ? <img src={character.avatar} alt={character.name} style={avatarStyle} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
                    : avatarFallback[characterId] ?? '👩'}
                </div>
              )}
              <div style={{
                maxWidth: '72%', padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg,#E91E63,#C2185B)' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: 14, lineHeight: 1.7,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0,
              }}>
                {msg.content}
              </div>
            </div>
          )
        ))}

        {(loading || loadingSummary) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {avatarHasImage
                ? <img src={character.avatar} alt={character.name} style={avatarStyle} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
                : avatarFallback[characterId] ?? '👩'}
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
                yui: 'またいつでも話しかけてね！', mio: '...また来てね。',
                haruka: 'またいつでも話しかけてね。', tomomi: 'またね！ゆっくり休んでね。',
                ayaka: 'また話してね〜！', noriko: 'またね。いつでも来てね。',
                kazuko: 'またいつでも話しかけてね。', michiko: 'またね。ゆっくり休んでね。',
                yoko: 'またいつでもね！', akiko: 'またいつでも話しかけてね😊',
                reiko: 'またね！いつでも来てね😊', sota: 'また話しかけてよ。',
                takashi: 'また来てくれ。', daisuke: 'またいつでも来てよ！',
                yusuke: 'また話しかけてな。', koji: '...また来てくれ。',
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

        {/* 相談まとめ結果 */}
        {soudanDone && soudanSummary && (() => {
          const lines = soudanSummary.split('\n').map(l => l.trim()).filter(Boolean)
          const labelLines = lines.filter(l => l.startsWith('📝'))
          const closingLines = lines.filter(l => !l.startsWith('📝'))
          const labels = labelLines.map(l => l.replace(/^📝\s*/, ''))
          const closing = closingLines.join(' ')
          return (
          <div style={{
            margin: '16px 0', background: 'linear-gradient(135deg,#F3E5F5,#EDE7F6)',
            borderRadius: 20, padding: '18px 20px',
            border: '1.5px solid #CE93D8', boxShadow: '0 2px 12px rgba(123,31,162,0.1)',
          }}>
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 700, marginBottom: 12 }}>
              💡 今日の相談、まとめたよ
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {labels.map((label, i) => (
                <span key={i} style={{
                  background: '#fff', border: '1.5px solid #CE93D8',
                  borderRadius: 20, padding: '6px 14px',
                  fontSize: 13, color: '#6A1B9A',
                  display: 'inline-block', userSelect: 'none',
                }}>
                  {label}
                </span>
              ))}
            </div>
            {closing && (
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, borderTop: '1px solid #CE93D8', paddingTop: 12 }}>
                {closing}
              </div>
            )}
            <button onClick={() => {
              setSoudanDone(false); setSoudanSummary('')
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
              setShowSoudanReplies(false)
              setShowAlternativeReplies(false)
            }} style={{
              marginTop: 12, background: 'none', border: '1px solid #CE93D8',
              borderRadius: 16, padding: '6px 16px', fontSize: 12,
              color: '#7B1FA2', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              もう一度相談する
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

      {/* モード切り替えトグル */}
      {nicknamePhase === 'done' && (
        <div style={{
          padding: '8px 12px 4px', display: 'flex', gap: 8, background: '#fdf4f7',
        }}>
          <button
            onClick={() => { setChatMode('guchi'); setShowSoudanReplies(false) }}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: chatMode === 'guchi' ? '1.5px solid #E91E63' : '1.5px solid #eee',
              background: chatMode === 'guchi' ? '#FCE4EC' : '#fff',
              color: chatMode === 'guchi' ? '#E91E63' : '#bbb',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >💬 愚痴聞きモード</button>
          <button
            onClick={() => { setChatMode('soudan'); setShowSoudanReplies(false) }}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: chatMode === 'soudan' ? '1.5px solid #7B1FA2' : '1.5px solid #eee',
              background: chatMode === 'soudan' ? '#F3E5F5' : '#fff',
              color: chatMode === 'soudan' ? '#7B1FA2' : '#bbb',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >💡 相談モード</button>
        </div>
      )}

      {/* クイック返信（愚痴聞きモード）- キーボード表示中は非表示で会話エリアを確保 */}
      {nicknamePhase === 'done' && showQuickReplies && !loading && chatMode === 'guchi' && !inputFocused && (
        <div style={{
          padding: '4px 12px 4px',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          background: '#fdf4f7',
        }}>
          {quickReplies.map(reply => (
            <button key={reply} onClick={() => journalLoaded && handleSend(reply)} style={{
              background: '#fff', border: '1.5px solid #F48FB1', borderRadius: 20,
              padding: '7px 14px', fontSize: 13, color: '#E91E63',
              cursor: journalLoaded ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', opacity: journalLoaded ? 1 : 0.6,
            }}
              onMouseEnter={e => { if (journalLoaded) e.currentTarget.style.background = '#FCE4EC' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >{reply}</button>
          ))}
        </div>
      )}

      {/* 相談モード：深掘りクイック返信（①②③が出た後に表示）- キーボード表示中は非表示 */}
      {nicknamePhase === 'done' && showSoudanReplies && !loading && chatMode === 'soudan' && !inputFocused && (
        <div style={{
          padding: '4px 12px 4px',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          background: '#fdf4f7',
        }}>
          {/* ①②③ 深掘りボタン */}
          {[
            { label: '①を詳しく', msg: '①について詳しく教えて' },
            { label: '②を詳しく', msg: '②について詳しく教えて' },
            { label: '③を詳しく', msg: '③について詳しく教えて' },
          ].map(item => (
            <button key={item.label}
              onClick={() => { handleSend(item.msg); setShowSoudanReplies(false) }}
              style={{
                background: '#F3E5F5', border: '1.5px solid #CE93D8', borderRadius: 20,
                padding: '7px 14px', fontSize: 13, color: '#7B1FA2',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{item.label}</button>
          ))}
          {/* ④⑤⑥ 別の提案ボタン */}
          <button
            onClick={() => { handleSend('さっきとは全く違う視点で、④⑤⑥として別の提案を3つ出してほしい'); setShowSoudanReplies(false) }}
            style={{
              background: '#FFF8E1', border: '1.5px solid #FFD54F', borderRadius: 20,
              padding: '7px 14px', fontSize: 13, color: '#F57F17',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >④⑤⑥ 他の提案ももらう</button>
          {/* 愚痴聞きモードに戻る */}
          <button
            onClick={() => { setChatMode('guchi'); setShowSoudanReplies(false) }}
            style={{
              background: '#fff', border: '1.5px solid #ddd', borderRadius: 20,
              padding: '7px 14px', fontSize: 12, color: '#aaa',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >やっぱり聞いてほしいだけ</button>
        </div>
      )}

      {/* 相談モード：④⑤⑥追加提案後の深掘りクイック返信 */}
      {nicknamePhase === 'done' && showAlternativeReplies && !loading && chatMode === 'soudan' && !inputFocused && (
        <div style={{
          padding: '4px 12px 4px',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          background: '#fdf4f7',
        }}>
          {[
            { label: '④を詳しく', msg: '④について詳しく教えて' },
            { label: '⑤を詳しく', msg: '⑤について詳しく教えて' },
            { label: '⑥を詳しく', msg: '⑥について詳しく教えて' },
          ].map(item => (
            <button key={item.label}
              onClick={() => { handleSend(item.msg); setShowAlternativeReplies(false) }}
              style={{
                background: '#FFF3E0', border: '1.5px solid #FFB74D', borderRadius: 20,
                padding: '7px 14px', fontSize: 13, color: '#E65100',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{item.label}</button>
          ))}
          {/* やっぱり①②③を選ぶ */}
          <button
            onClick={() => { setShowAlternativeReplies(false); setShowSoudanReplies(true) }}
            style={{
              background: '#F3E5F5', border: '1.5px solid #CE93D8', borderRadius: 20,
              padding: '7px 14px', fontSize: 13, color: '#7B1FA2',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >やっぱり①②③から選ぶ</button>
        </div>
      )}

      {/* 通常入力エリア */}
      {nicknamePhase === 'done' && (
        <div style={{
          background: '#fff', borderTop: '1px solid #FCE4EC',
          // キーボード表示中はsafe-area-inset-bottomが不要（キーボードがその領域をカバー）
          paddingBottom: inputFocused ? 4 : 'max(4px, env(safe-area-inset-bottom))', flexShrink: 0,
        }}>
          {/* 入力行 */}
          <div style={{ padding: '10px 12px 6px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 200)}  // 200ms遅延でレイアウト変化前にclickが届く
              onKeyDown={handleKeyDown}
              placeholder={
                chatMode === 'soudan' ? `${character.name}に相談する…`
                : `${character.name}に話しかける…`
              }
              rows={1}
              style={{
                flex: 1,
                border: `1.5px solid ${chatMode === 'soudan' ? '#CE93D8' : '#F48FB1'}`,
                borderRadius: 20,
                padding: '10px 16px',
                fontSize: 16, // ← iOSズーム防止（16px以上必須）
                outline: 'none',
                background: chatMode === 'soudan' ? '#FAF5FF' : '#fdf4f7',
                resize: 'none', lineHeight: 1.5,
                maxHeight: 100, overflowY: 'auto', fontFamily: 'inherit',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 100) + 'px'
              }}
            />

            <button
              // iOS: touchEnd(blur前)で直接送信 → click は preventDefault で抑制し二重発火防止
              onTouchEnd={(e) => {
                e.preventDefault()
                if (input.trim() && !loading && journalLoaded) handleSend()
              }}
              onClick={() => handleSend()}  // デスクトップ(マウス)用
              disabled={!input.trim() || loading || !journalLoaded}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: input.trim() && !loading && journalLoaded ? 'linear-gradient(135deg,#E91E63,#C2185B)' : '#F8BBD9',
                color: '#fff', fontSize: 18,
                cursor: input.trim() && !loading && journalLoaded ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s',
              }}>↑</button>
          </div>

          {/* そろそろ終わりにするボタン（愚痴モード） */}
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
          {/* そろそろ終わりにするボタン（相談モード） */}
          {showSoudanFooterButton && (
            <div style={{ textAlign: 'center', paddingBottom: 10 }}>
              <button onClick={handleSoudan} style={{
                background: 'none', border: 'none',
                fontSize: 12, color: '#bbb', cursor: 'pointer',
                fontFamily: 'inherit', padding: '2px 8px',
                textDecoration: 'underline', textDecorationColor: '#d0b0e0',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#7B1FA2' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#bbb' }}
              >
                💡 そろそろ終わりにする
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
