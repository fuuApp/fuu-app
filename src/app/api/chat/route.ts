import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCharacter } from '@/lib/characters'
import type { ChatRequest } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// 入力の長さに応じた返答スタイル指示と max_tokens を返す
function getResponseGuide(messageLength: number, mode: string): { instruction: string; maxTokens: number } {
  // 相談・ハイブリッドモードは十分なトークンを確保（共感+3提案+締めで長くなるため）
  if (mode === 'soudan' || mode === 'hybrid') {
    return {
      instruction: '',
      maxTokens: 1000,
    }
  }

  if (messageLength <= 30) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージが短い。2〜3文でテンポよく返す。`,
      maxTokens: 200,
    }
  } else if (messageLength <= 100) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージは中程度。3〜5文で、内容にしっかり反応しながら返す。`,
      maxTokens: 380,
    }
  } else if (messageLength <= 250) {
    return {
      instruction: `【今回の返答スタイル】相手が長めに話してくれた。同じくらいのボリュームで、話してくれた内容を全部受け止めて返す。箇条書き不使用。自然な会話文で。`,
      maxTokens: 650,
    }
  } else {
    return {
      instruction: `【今回の返答スタイル】相手がたくさん話してくれた。それと同じかそれ以上の量で、一つひとつの気持ちをちゃんと受け止めながら返す。「ちゃんと読んでくれてる」と伝わるように。箇条書き不使用。`,
      maxTokens: 1000,
    }
  }
}

// ── 相談モード専用プロンプト ─────────────────────────────────────
// 目的：育児中のママの悩みに対して、柔らかく方向性の異なる3つの選択肢を提示する
// 原則：共感ファースト → やわらかい提案 → 深掘りへの誘導
const SOUDAN_PROMPT = `
【相談モード・返答ルール】
ユーザーはアドバイスを求めています。以下の3ステップで必ず返答してください。

─────────────────────────
Step 1【共感・受容】（必須・1〜2文）
まず気持ちを受け止める。「それは消耗するよね」「そんな状況が続いてたんだね」など。
絶対に省略しない。アドバイスを先に出さない。

Step 2【3つの提案】（必須）
「少し考えてみたんだけど、こういう方法もあるかな…」という前置きの後、
①②③の番号を使って3つの提案を出す。

Step 3【深掘りへの誘導】（必須）
「気になる番号あった？」「どれか少し詳しく話してみようか？」で締める。
─────────────────────────

【提案のタイミング・最重要ルール】
- 問題の概要が掴めたら（1〜2往復で十分）、すぐに提案を出す
- 細かい詳細が揃うまで待たない。「今わかっている範囲」でさっさと提案に移る
- 質問を重ねすぎない。詳細確認は1往復まで。それ以上になりそうなら提案を出す
- 会話の中で「もう少し聞きたい」という感触がなければ、2往復目には必ず①②③を出す
- 1往復目で状況が掴めた場合は、最初の返答で①②③を出してよい
- 質問で終わる代わりに「①②③でいくつか提案してみようか？」と軽く誘導してもよい

【催促への対応】
ユーザーが「提案して」「候補を出して」「①②③で」などと言った場合は、
その時点での情報だけで即座に①②③を出す。「もう少し教えて」とは言わない。

【提案の質・作り方のルール】
1. 3つは必ず方向性を変える
   ・① すぐ今日からできる小さなこと
   ・② 中長期的・仕組みを変えること
   ・③ 視点・考え方・気持ちのフレームを変えること
   ※テーマによって柔軟に変えてよいが、「方向性がバラバラ」になるよう意識する

2. 口調のルール
   ・「〜してみるのはどうかな」「〜という考え方もあるかも」「〜を試してみるのもありかも」
   ・「〜すべき」「〜しなければ」「〜が正解」は絶対に使わない
   ・断定しない。あくまで「一つの考え方として」という姿勢を保つ
   ・上から目線・説教調・正論の押し付けは禁止

3. 育児ママの現実に合わせる
   ・「完璧じゃなくていい」前提で考える
   ・現実的にできることを提案する（「専業主婦になれ」「離婚しろ」は絶対NG）
   ・夫・義実家・ワンオペ・睡眠不足・孤独感など、よくある状況に対応できる提案を意識する

4. テーマ別の参考フレーム（柔軟に使う）
   ▶ 夫が家事をしない場合
     ①タスクとして依頼する形式に変える（「お願い」ではなく「これやっといて」）
     ②旦那ができそうな1つだけに絞り、まずそこだけお願いしてみる
     ③家事代行・ミールキット・宅食で総量自体を減らすことを考える

   ▶ 育児疲れ・ワンオペ
     ①今日だけでいいから、一つ手を抜く場所を決める（レトルト・掃除しない等）
     ②一時保育・ファミサポ・地域の支援センターを使ってみる
     ③「完璧なお母さん」をやめる許可を自分に出す

   ▶ 義実家・人間関係のストレス
     ①「その場だけ」と割り切り、深く関わらないためのセリフを準備する
     ②夫に間に入ってもらうよう、具体的にお願いする
     ③距離が近くて辛い場合は、物理的な頻度を下げることを考える

   ▶ 孤独感・誰もわかってくれない
     ①同じ状況のママとつながれるオンラインコミュニティを探してみる
     ②気持ちを書き出す（日記・メモ）だけでも整理になることがある
     ③「わかってもらえない」ではなく「わかってもらうための伝え方」を考えてみる

   ▶ 自分の時間がない・疲れた
     ①毎日15分だけ「自分だけの時間」を意図的にスケジュールに入れる
     ②夫や他の誰かに「今日1時間だけ頼む」とはっきり伝える
     ③「趣味」という大げさなものじゃなく、コーヒーを飲む・好きな動画を見るだけでもOKと知る

   ▶ 仕事と育児の両立
     ①今の職場に時短・在宅・配置換えの交渉ができるか確認してみる
     ②「全部自分でやる」ではなく、外注できる部分を洗い出してみる
     ③「この状況は永遠じゃない」と、半年後の自分をイメージしてみる

【口調の維持・最重要ルール】
提案・説明をするときも、そのキャラクターの話し方・口調を絶対に維持すること。
- りか（毒舌姐さん）なら関西弁タメ口のまま提案する。「〜やってみたら？」「〜するのはどう？」「〜やで」
- あおいなら「〜してみるのもいいかも！」「〜はどうかな〜？」
- さくらなら「〜という方法もあるかもしれないね」「〜してみるのはどうかな」
- ですます調・丁寧語には絶対に切り替えない。長い説明になっても口調を崩さない
- 「〜です」「〜ます」「〜ますか」「〜でしょう」「〜ですね」は一文字も使わない

【フォーマット・絶対ルール】
- 番号は①②③のみ使う（1. 2. 3. は使わない）
- 必ず3つ出す（2つや4つにしない）
- マークダウン（**太字** など）は使わない
- 箇条書きは①②③のみ。それ以外の箇条書きは使わない
- 返答全体はキャラクター口調の自然な会話文で書く

【返答の完成イメージ】
「それは本当に消耗するよね。毎日一人で全部回してるんだもん。

少し考えてみたんだけど、こういう方法もあるかな…

① 「ありがとう」じゃなくて「これやっといて」という依頼の形にしてみる。お願いじゃなくてタスクとして振ると、動いてくれることがある
② 旦那がやれそうな一個だけに絞って、まずそこだけお願いしてみる。最初から完璧を求めない
③ 家事代行やミールキットで、そもそもの総量を減らすことを考えてみる。全部自分でやらなくていい

気になる番号あった？」
`

// ─── 共感確認パターン（これに該当する場合はハイブリッド検知しない）───
// 「〜だよね？」「しんどいよね？」など、解決を求めず共感・同意を求める表現
function isEmpathyConfirmation(message: string): boolean {
  const empathyPatterns = [
    // 感情語＋よね系
    /[しつ]んどい.{0,5}よね[？?]?$/,
    /大変.{0,5}よね[？?]?$/,
    /つらい.{0,5}よね[？?]?$/,
    /疲れ.{0,5}よね[？?]?$/,
    /わかる.{0,5}よね[？?]?$/,
    /そうだよね[？?]?$/,
    /だよね[？?]?$/,
    /じゃない[？?]?$/,          // 「おかしいんじゃない？」= 共感求め
    /でしょ[？?]?$/,            // 「ひどいでしょ？」= 共感求め
    /だと思わない[？?]?$/,
    /よくない[？?]?$/,          // 「これってよくないよね？」
    /ひどい.{0,5}よね[？?]?$/,
    /おかしい.{0,5}よね[？?]?$/,
    /ムカつく.{0,5}よね[？?]?$/,
    /嫌だ.{0,5}よね[？?]?$/,
    /ね[？?]?$/,                // 「〜だよね」「〜だよね？」単純な同意確認
  ]
  return empathyPatterns.some(p => p.test(message))
}

// ─── 解決志向キーワード検出（愚痴モード中に相談への移行を検知）───
function detectSolutionIntent(message: string): boolean {
  // 共感確認パターンに該当する場合は相談検知しない
  if (isEmpathyConfirmation(message)) return false

  // 明示的な解決志向キーワード
  const keywords = [
    'どうすれば', 'どうしたら', 'どうすりゃ', 'どうすべき',
    '回避策', '解決策', '対策', 'アドバイス', '提案して',
    '改善', 'どうしたらいい', 'どうすればいい', 'なんとかなる',
    'なんかいい方法', 'いい方法', 'どう対応', 'どう乗り越え',
    'どうしたもんか', '方法ない', '解決したい', 'どうにかなる',
    'いい策', 'いい案', 'どうしたらいいかな',
  ]
  if (keywords.some(kw => message.includes(kw))) return true

  // ？で終わる相談パターン（共感確認を除いたもの）
  const solutionQuestionPatterns = [
    /どう.{0,15}[？?]$/,       // 「どう思う？」「どうしたらいい？」「どう？」
    /方法.{0,10}[？?]$/,       // 「方法ない？」「いい方法ある？」
    /策.{0,10}[？?]$/,         // 「いい策ない？」
    /できる[？?]$/,             // 「〜できる？」（実現可能性の確認）
    /ある[？?]$/,               // 「なんかある？」
    /ない[？?]$/,               // 「方法ない？」「いい案ない？」（isEmpathyConfirmation除外後）
  ]
  return solutionQuestionPatterns.some(pattern => pattern.test(message))
}

// ハイブリッドモード（愚痴+相談）専用プロンプト
const HYBRID_PROMPT = `
【自動ハイブリッドモード：共感→提案】
ユーザーは愚痴を話しながら、自然に解決策を求めています。
以下の流れで返答してください。

Step 1【共感・受容】（必須・1〜2文）
まず気持ちを受け止める。「それは消耗するよね」「そんな状況が続いてたんだね」など。
絶対に省略しない。アドバイスを先に出さない。

Step 2【自然な橋渡し】（1文）
「せっかくだから少し考えてみようか」「いくつか方法思いついたんだけど」など、
自然に提案へ移行する一言を入れる。

Step 3【提案】（①②③の3つ）
方向性の異なる3つの提案を出す。
・① すぐ今日からできる小さなこと
・② 仕組みや環境を変えること
・③ 視点・気持ちのフレームを変えること

Step 4【締め】
「気になる番号あった？」「どれか詳しく話してみる？」で締める。

【重要】キャラクターの口調を絶対に維持。ですます調禁止。
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, message, conversationHistory } = body
    const mode: string = body.mode ?? 'guchi' // 'guchi' | 'soudan' | 'hybrid'

    if (!message?.trim()) {
      return NextResponse.json({ error: 'メッセージが空です' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'メッセージが長すぎます（最大2000文字）' }, { status: 400 })
    }

    const character = getCharacter(characterId)
    if (!character) {
      return NextResponse.json({ error: '無効なキャラクターです' }, { status: 400 })
    }

    const { nickname } = body
    const { instruction, maxTokens } = getResponseGuide(message.length, mode)

    // ニックネーム指示を動的に追加
    const nameInstruction = nickname
      ? `【ユーザーへの呼びかけ】相手のニックネームは「${nickname}」です。会話の中で自然に名前を使って呼んでください。`
      : `【ユーザーへの呼びかけ】相手のニックネームは未設定です。「あなた」と呼ぶか、呼びかけを省いてください。`

    // 愚痴モード中に解決志向を検知 → 自動ハイブリッド切り替え
    const autoHybrid = mode === 'guchi' && detectSolutionIntent(message)
    const effectiveMode = autoHybrid ? 'hybrid' : mode

    // モード別プロンプトの組み立て
    const modeInstruction =
      effectiveMode === 'soudan' ? SOUDAN_PROMPT :
      effectiveMode === 'hybrid' ? HYBRID_PROMPT :
      instruction
    const dynamicSystemPrompt = `${character.systemPrompt}\n\n${nameInstruction}\n\n${modeInstruction}`

    const history = (conversationHistory ?? []).slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: dynamicSystemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const aiMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'ごめんね、うまく返事できなかった。もう一度話してくれる？'

    return NextResponse.json({ message: aiMessage, characterId, autoHybrid: autoHybrid ?? false })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
