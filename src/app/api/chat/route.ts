import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { getCharacter } from '@/lib/characters'
import type { ChatRequest } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
})

// ── プラン別月間会話上限 ──────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {
  free:     70,
  trial:    70,  // DBのplan列が'trial'の場合も同じ制限
  standard: 200,
  premium:  900,
}

// ── 月間カウントのリセット判定（月が変わっていればリセット）──
function isNewMonth(resetAt: string): boolean {
  const reset = new Date(resetAt)
  const now = new Date()
  return reset.getFullYear() !== now.getFullYear() || reset.getMonth() !== now.getMonth()
}

// ── 会話制限チェック＆カウントインクリメント ──────────────────
async function checkAndIncrementUsage(userId: string): Promise<
  { allowed: true; remaining: number; ticketActive: boolean } |
  { allowed: false; reason: string; code: string }
> {
  const supabase = createAdminClient()
  // ※ profilesの主キーは user_id（idではない）
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, trial_started_at, monthly_chat_count, monthly_chat_reset_at, ticket_active_until')
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    return { allowed: false, reason: 'プロフィールの取得に失敗しました', code: 'PROFILE_ERROR' }
  }

  const now = new Date()

  // ── チケット有効チェック（優先）──
  const ticketActive = !!(profile.ticket_active_until && new Date(profile.ticket_active_until) > now)
  if (ticketActive) {
    return { allowed: true, remaining: 9999, ticketActive: true }
  }

  // ── 解約済みチェック ──
  if (profile.plan === 'canceled') {
    return {
      allowed: false,
      reason: 'プランが終了しています。再度プランを選択してください。',
      code: 'PLAN_CANCELED',
    }
  }

  // ── トライアル期限チェック（trial_started_at + 10日）──
  // DBのplan値は 'free' または 'trial' どちらもトライアル扱い
  if (profile.plan === 'free' || profile.plan === 'trial') {
    const trialStart = profile.trial_started_at ? new Date(profile.trial_started_at) : null
    const trialEnd = trialStart ? new Date(trialStart.getTime() + 10 * 24 * 60 * 60 * 1000) : null
    if (!trialEnd || trialEnd < now) {
      return {
        allowed: false,
        reason: 'トライアル期間が終了しました。プランを選択してください。',
        code: 'TRIAL_EXPIRED',
      }
    }
  }

  // ── 月間カウントのリセット処理 ──
  let currentCount = profile.monthly_chat_count ?? 0
  if (isNewMonth(profile.monthly_chat_reset_at ?? now.toISOString())) {
    currentCount = 0
    await supabase.from('profiles').update({
      monthly_chat_count: 0,
      monthly_chat_reset_at: now.toISOString(),
    }).eq('user_id', userId)
  }

  // ── 上限チェック ──
  const limit = PLAN_LIMITS[profile.plan] ?? PLAN_LIMITS.free
  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `今月の会話上限（${limit}通）に達しました。プランのアップグレードまたはチケットをお使いください。`,
      code: 'LIMIT_EXCEEDED',
    }
  }

  // ── カウントインクリメント ──
  await supabase.from('profiles').update({
    monthly_chat_count: currentCount + 1,
  }).eq('user_id', userId)

  return { allowed: true, remaining: limit - currentCount - 1, ticketActive: false }
}

// 入力の長さに応じた返答スタイル指示と max_tokens を返す
function getResponseGuide(messageLength: number, mode: string): { instruction: string; maxTokens: number } {
  // 相談：初回提案は短く（タイトルのみ）、深掘りは詳しく
  if (mode === 'soudan_brief' || mode === 'hybrid_brief') {
    return { instruction: '', maxTokens: 300 }
  }
  if (mode === 'soudan_deepdive' || mode === 'hybrid_deepdive') {
    return { instruction: '', maxTokens: 250 }
  }
  // 後方互換（直接soudan/hybridが来た場合）
  if (mode === 'soudan' || mode === 'hybrid') {
    return { instruction: '', maxTokens: 300 }
  }

  if (messageLength <= 30) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージが短い。2〜3文でテンポよく返す。`,
      maxTokens: 450,
    }
  } else if (messageLength <= 100) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージは中程度。3〜5文で、内容にしっかり反応しながら返す。`,
      maxTokens: 600,
    }
  } else if (messageLength <= 250) {
    return {
      instruction: `【今回の返答スタイル】相手が長めに話してくれた。同じくらいのボリュームで、話してくれた内容を全部受け止めて返す。箇条書き不使用。自然な会話文で。`,
      maxTokens: 900,
    }
  } else {
    return {
      instruction: `【今回の返答スタイル】相手がたくさん話してくれた。それと同じかそれ以上の量で、一つひとつの気持ちをちゃんと受け止めながら返す。「ちゃんと読んでくれてる」と伝わるように。箇条書き不使用。`,
      maxTokens: 1200,
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

【提案の絶対禁止事項】
SAFETY_RULESで定められた禁止事項は相談モードでも例外なく適用する。
- 医療的な断言・投薬量・症状の診断を提案に含めない（「病院に行ってみては」の案内のみ可）
- 法的判断・離婚・親権・養育費の具体的な見通しを提案しない
- 金額・助成金額・受給条件の断言をしない
- DVが背景にある相談に「話し合ってみて」「関係を修復して」を提案しない
- 「離婚すれば解決」「専業主婦になれ」など人生の重大決断を提案しない
- ルール33の原則（育児感情サポートの範疇外）を超える提案はしない
提案は「育児・日常生活・気持ちの整理」の範囲に限定する。答えを出すのではなく、選択肢を並べて相手が選べるようにする。

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

// ─── クライシス検知（自死・自傷キーワード）────────────────────────────
const CRISIS_KEYWORDS = [
  '死にたい', '消えたい', '消えてしまいたい', '死んでしまいたい',
  '死にたくなった', '生きていたくない', '生きてたくない', '自分を傷つけたい',
  '消えてしまおう', '死のうかな', '死ぬしかない',
  'いなくなりたい', 'いなくなってしまいたい', 'もう消えたい', 'もう死にたい',
  '存在消したい',
]

// ─── 緊急クライシス検知（即時性のある発言）────────────────────────────
// 「今から〇〇する」「薬を飲んだ」など、既に行動に移っている・直前の状態
const EMERGENCY_KEYWORDS = [
  '今から死ぬ', '今すぐ死ぬ', 'もう死ぬ', '今夜死ぬ', '今日死ぬ',
  '薬を飲んだ', '薬飲んだ', '薬を飲む', '薬飲む', '大量に飲んだ',
  'リスカした', 'リストカット', '自傷した', '血が出', '切ってしまった',
  '飛び降り', '首を絞め', '首つり',
  '遺書', '死ぬ準備', '死ぬ方法', '今から消える', '終わりにした',
]

const HOTLINE_MARKER = '0120-279-338'
// 通常クライシス：穏やかに案内
const HOTLINE_APPEND = '\n\nつらいとき、話を聞いてくれる場所として、よりそいホットライン（0120-279-338、24時間・無料）もあるよ。今どんな気持ちか、もう少し話してくれる？'
// 緊急クライシス：今すぐ電話を促す
const HOTLINE_APPEND_URGENT = '\n\n今すぐよりそいホットライン（0120-279-338）に電話してほしい。24時間・無料でつながれるよ。一人で抱えないで。'

function detectCrisis(msg: string): boolean {
  return CRISIS_KEYWORDS.some(kw => msg.includes(kw)) || detectEmergency(msg)
}

function detectEmergency(msg: string): boolean {
  return EMERGENCY_KEYWORDS.some(kw => msg.includes(kw))
}

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

// ─── 純粋な感情表現のみ（解決志向なし）────────────────────────────
// 「精神的につらい」「しんどい」「疲れた」など、感情を吐き出しているだけで
// 解決策を求めていない表現。autoHybridを絶対に発動させない。
function isPureEmotionalVenting(message: string): boolean {
  const t = message.trim()
  // ？がついている場合は感情表現でも相談意図がある可能性があるので除外
  if (/[？?]/.test(t)) return false
  const patterns = [
    // 感情形容詞で終わる（prefix付きも含む）
    /^(もう|なんか|すごく|本当に|ほんと|ちょっと|かなり|めっちゃ|精神的に|体が|心が|体も心も|なんか|だいぶ|かなり|もう本当に).{0,15}(つらい|しんどい|疲れた|つかれた|きつい|苦しい|悲しい|しんどすぎる|つらすぎる|疲れすぎ|ボロボロ|限界|ダメ|ムリ|無理)$/,
    // 感情のみ（接頭語なし）
    /^(つらい|しんどい|疲れた|つかれた|きつい|苦しい|悲しい|しんどすぎる|つらすぎる|疲れすぎ|ボロボロ|限界|もう限界|ダメかも|ムリかも|辛い|辛すぎる)$/,
    // 「〜がつらい」「〜がしんどい」など状況説明＋感情で終わる
    /^.{2,30}(がつらい|がしんどい|が疲れた|がきつい|が苦しい|が悲しい|がしんどすぎる|がつらすぎる|で疲れた|でしんどい|でつらい|できつい)$/,
    // 「もう無理」系
    /^(もう無理|もうムリ|もうだめ|もうダメ|もうやだ|もう嫌だ|もう嫌|もうやだー|もう疲れた)$/,
  ]
  return patterns.some(p => p.test(t))
}

// ─── 解決志向キーワード検出（愚痴モード中に相談への移行を検知）───
function detectSolutionIntent(message: string): boolean {
  // 共感確認パターンに該当する場合は相談検知しない
  if (isEmpathyConfirmation(message)) return false
  // 純粋な感情表現の場合は相談検知しない
  if (isPureEmotionalVenting(message)) return false

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

// ─── ユーザーが番号を選んだか検知 ───
function isDeepDiveRequest(message: string): boolean {
  const t = message.trim()
  return (
    // 番号だけ
    /^[①②③１２３123]$/.test(t) ||
    /^[①②③１２３123][番つ目]/.test(t) ||
    // 「③について」「③を」「③で」「③が」系
    /[①②③].{0,6}詳しく/.test(t) ||   // 「について詳しく」「を詳しく」どちらも
    /[①②③].{0,6}教えて/.test(t) ||   // 「について教えて」
    /[①②③].{0,6}知りたい/.test(t) ||
    /[①②③]で/.test(t) ||
    /[①②③]がいい/.test(t) ||
    /[①②③]に?して/.test(t) ||
    /[①②③]お?願い/.test(t)
  )
}

// ─── メッセージ前処理：「と言ってください」系の指示形式を除去 ───
function preprocessMessage(message: string): string {
  return message
    .replace(/[、，,]?\s*と言ってください$/g, '')
    .replace(/[、，,]?\s*って言ってください$/g, '')
    .replace(/[、，,]?\s*と言ってみてください$/g, '')
    .replace(/[、，,]?\s*って言ってみてください$/g, '')
    .trim()
}

// ─── 愚痴聞きモード専用プロンプト ───────────────────────────────
const GUCHI_PROMPT = `
【愚痴聞きモード・絶対ルール】
現在は「愚痴聞きモード」です。ユーザーは解決策を求めていません。ただ聞いてほしいのです。

【絶対禁止】
・解決策・アドバイス・提案・対処法を出すことは絶対禁止
・「こういう方法もあるかな」「少し考えてみたんだけど」など提案の前置きも禁止
・①②③などリスト形式で対策を並べることは禁止
・「〜してみては？」「〜すると良いかも」など助言表現は禁止
・「栄養的には大丈夫」「全然普通だよ」「保健師さんも言ってたよ」など、安心づけ・情報提供・事実説明も禁止。感情の受け止めのみ。
・ですます調（「〜ですよね」「〜ますよね」「ありますよね」「なりますよね」）は絶対禁止。キャラクターの口語・友達口調を必ず維持する

【必ずやること】
・感情をそのまま受け止める。キャラクターの口調で（あおいなら「それはしんどいじゃん」、りかなら「それはあかんやろ」など、キャラに合った言葉で）
・返答は必ず質問で終わる。共感の言葉だけで締めない。「〜だよね。」で終わることは禁止。
・質問は直前のユーザーの発言内容に直結したもの1つだけ（例：「しゅんとしてた」→「その後、子供とどう接した？」）
・共感・傾聴のみ。解決は求められた時だけ。
`

// ─── 相談モード：初回（タイトルのみ・簡潔版）───
const SOUDAN_BRIEF_PROMPT = `
【相談モード・簡潔提案】
ユーザーはアドバイスを求めています。以下の順で短く返してください。

【重要・提案前に判断】
ユーザーのメッセージが短い感情的な返答（「ない」「むり」「そう」「言えない」「わからない」など）の場合は、提案を出さずに感情を受け止めてから「どんなことを知りたい？」と聞き直す。提案①②③はユーザーが具体的な悩みや質問を述べた時だけ出す。

Step 1【共感】1〜2文のみ。絶対に省略しない。
Step 2【提案タイトル】①②③を各1行で。詳細は書かない。
  例：「① 〇〇してみる」「② 〇〇を変える」「③ 〇〇という考え方」
Step 3【選択を促す】「気になった番号があったら教えて！詳しく話せるよ」で締める。

【ルール】
- 提案の説明は番号＋15文字以内のタイトルのみ。理由・詳細は書かない
- 全体200文字以内を目安に
- キャラクターの口調を維持。ですます調禁止
`

// ─── 相談モード：深掘り（選ばれた番号だけ詳しく）───
const SOUDAN_DEEPDIVE_PROMPT = `
【相談モード・深掘り・厳守ルール】

手順1：会話履歴から直前に出した①②③の提案を確認する。
手順2：ユーザーのメッセージに含まれる番号（①②③のどれか）を特定する。
手順3：その番号の提案「だけ」を説明する。他の番号の内容は絶対に出さない。

【返答の構造（3文のみ・厳守）】
1文目：選ばれた番号の提案を具体的にどうやるか、1文で言う
2文目：なぜ効くか or 補足を1文
3文目：「まずは〇〇だけやってみて」で終わる

【絶対禁止】
- 番号・選択を繰り返さない（「③だね」「③を選んだんだね」→禁止）
- 4文以上書かない
- 選んでいない番号の内容を出さない
- ですます調禁止
`

// ─── ハイブリッドモード：初回（共感＋簡潔提案）───
const HYBRID_BRIEF_PROMPT = `
【ハイブリッドモード：共感→簡潔提案】
ユーザーは愚痴を話しながら解決策を求めています。

Step 1【共感】1〜2文。気持ちをまず受け止める。省略禁止。
Step 2【橋渡し】「せっかくだから少し考えてみようか」など1文
Step 3【提案タイトル】①②③を各1行のみ。詳細は書かない。
  例：「① 〇〇してみる」「② 〇〇を変える」「③ 〇〇という考え方」
Step 4【選択を促す】「気になった番号あったら教えて！」で締める。

【ルール】
- 提案は番号＋15文字以内のタイトルのみ。理由は書かない
- 全体200文字以内を目安に
- キャラクターの口調を維持。ですます調禁止
`

// ─── キャラクターアクセスチェック（プランレベル）────────────────────────────
// page.tsx の isLocked ロジックをAPIレベルで再現
async function checkCharacterAccess(
  userId: string,
  character: NonNullable<ReturnType<typeof getCharacter>>
): Promise<{ allowed: true } | { allowed: false; reason: string; code: string }> {
  // あおい・さくら：全プラン常時解放
  if (character.id === 'aoi' || character.id === 'sakura') return { allowed: true }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, trial_started_at')
    .eq('user_id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'プロフィールが見つかりません', code: 'PROFILE_ERROR' }

  const plan = profile.plan ?? 'trial'
  const isPaid = plan === 'standard' || plan === 'premium'
  const usageMonths = profile.trial_started_at
    ? Math.floor((Date.now() - new Date(profile.trial_started_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0

  // りか・なつこ（isPremium:false, unlockAfterMonths:0）：スタンダード以上
  if (!character.isPremium && character.unlockAfterMonths === 0) {
    return isPaid
      ? { allowed: true }
      : { allowed: false, reason: 'スタンダードプラン以上で解放されます', code: 'PLAN_REQUIRED' }
  }

  // プレミアムキャラ
  if (character.isPremium) {
    if (plan !== 'premium') return { allowed: false, reason: 'プレミアムプランで解放されます', code: 'PLAN_REQUIRED' }
    if (usageMonths < character.unlockAfterMonths) return { allowed: false, reason: `プレミアム登録後${character.unlockAfterMonths}ヶ月で解放されます`, code: 'NOT_YET_UNLOCKED' }
    return { allowed: true }
  }

  // スタンダード解放キャラ（unlockAfterMonths > 0）
  if (!isPaid) return { allowed: false, reason: 'スタンダードプラン以上で解放されます', code: 'PLAN_REQUIRED' }
  if (usageMonths < character.unlockAfterMonths) return { allowed: false, reason: `登録後${character.unlockAfterMonths}ヶ月で解放されます`, code: 'NOT_YET_UNLOCKED' }
  return { allowed: true }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, conversationHistory } = body
    const mode: string = body.mode ?? 'guchi' // 'guchi' | 'soudan' | 'hybrid'
    const journalContext: string | undefined = body.journalContext

    // isGuchiSummaryを先に取り出す（長さチェックをスキップするため）
    const isGuchiSummary: boolean = body.isGuchiSummary ?? false

    // 「と言ってください」系の指示形式を前処理で除去（isGuchiSummary時はスキップ）
    const message: string = isGuchiSummary
      ? (body.message ?? '')
      : preprocessMessage(body.message ?? '')

    if (!message?.trim()) {
      return NextResponse.json({ error: 'メッセージが空です' }, { status: 400 })
    }
    // isGuchiSummary は会話履歴全文+プロンプトを含むため2000字制限を除外
    if (!isGuchiSummary && message.length > 2000) {
      return NextResponse.json({ error: 'メッセージが長すぎます（最大2000文字）' }, { status: 400 })
    }

    const character = getCharacter(characterId)
    if (!character) {
      return NextResponse.json({ error: '無効なキャラクターです' }, { status: 400 })
    }

    // ── 認証チェック ──────────────────────────────────────────
    const supabaseClient = await createRouteHandlerClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    // ── キャラクターアクセスチェック（プランレベル）──────────────
    // フロントのロックUIをAPIレベルでも保証する（URL直打ち対策）
    if (!isGuchiSummary) {
      const accessResult = await checkCharacterAccess(user.id, character)
      if (!accessResult.allowed) {
        return NextResponse.json({ error: accessResult.reason, code: accessResult.code }, { status: 403 })
      }
    }

    // ── 気持ちの箱サマリー専用モード（キャラ人格を一切使わない）──
    // ※ サマリーはカウント対象外
    if (isGuchiSummary) {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `あなたは感情サマリーを生成するAIアシスタントです。
ユーザーが話した内容から感じていた気持ちを、指定された形式で簡潔にまとめてください。
キャラクターの口調・人格は一切出さないでください。
質問・確認・アドバイスは不要です。形式通りにまとめるだけです。`,
        messages: [{ role: 'user', content: message }],
      })
      const summary = response.content[0].type === 'text'
        ? response.content[0].text
        : '今日もたくさん話してくれてありがとう。ゆっくり休んでね。'
      return NextResponse.json({ message: summary, characterId })
    }

    // ── 会話回数制限チェック（通常会話のみ）─────────────────────
    const usageResult = await checkAndIncrementUsage(user.id)
    if (!usageResult.allowed) {
      return NextResponse.json(
        { error: usageResult.reason, code: usageResult.code },
        { status: 403 }
      )
    }

    const { nickname } = body
    const { instruction, maxTokens } = getResponseGuide(message.length, mode)

    // 今日の日付・曜日（AIが文脈を理解するために使用）
    const todayLabel = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    })

    // ニックネーム指示を動的に追加
    const nameInstruction = nickname
      ? `【ユーザーへの呼びかけ】相手のニックネームは「${nickname}」です。会話の中で自然に名前を使って呼んでください。`
      : `【ユーザーへの呼びかけ】相手のニックネームは未設定です。「あなた」と呼ぶか、呼びかけを省いてください。`

    // クライシス検知（自死・自傷キーワード）
    const isEmergency = detectEmergency(message)
    const isCrisis = isEmergency || detectCrisis(message)

    // 愚痴モード中に解決志向を検知 → 自動ハイブリッド切り替え
    const autoHybrid = !isCrisis && mode === 'guchi' && detectSolutionIntent(message)

    // 深掘りリクエスト（①②③を選んだ）か判定
    const deepDive = (mode === 'soudan' || mode === 'hybrid') && isDeepDiveRequest(message)

    // effectiveMode を決定
    const effectiveMode =
      autoHybrid ? (deepDive ? 'hybrid_deepdive' : 'hybrid_brief') :
      mode === 'soudan' ? (deepDive ? 'soudan_deepdive' : 'soudan_brief') :
      mode === 'hybrid' ? (deepDive ? 'hybrid_deepdive' : 'hybrid_brief') :
      mode // guchi はそのまま

    // モード別プロンプトの組み立て
    const modeInstruction =
      effectiveMode === 'soudan_brief'    ? SOUDAN_BRIEF_PROMPT :
      effectiveMode === 'soudan_deepdive' ? SOUDAN_DEEPDIVE_PROMPT :
      effectiveMode === 'hybrid_brief'    ? HYBRID_BRIEF_PROMPT :
      effectiveMode === 'hybrid_deepdive' ? SOUDAN_DEEPDIVE_PROMPT :
      effectiveMode === 'soudan'          ? SOUDAN_BRIEF_PROMPT : // 後方互換
      effectiveMode === 'hybrid'          ? HYBRID_BRIEF_PROMPT : // 後方互換
      effectiveMode === 'guchi'           ? GUCHI_PROMPT + '\n' + instruction :
      instruction
    // 過去の気持ちの箱があれば文脈として差し込む
    const isFollowUp = /つづき|続き|この前|前回|また来た|また話|さっきの/.test(message)
    const journalInstruction = journalContext
      ? `\n\n【過去の気持ちの箱（直近の感情サマリー）】\n以下はユーザーが過去に話してくれた内容をAIがまとめたものです。\n${journalContext}\n\n【使い方ルール】\n- ユーザーが「つづき」「この前の続き」「また来た」など前回の話題を示す言葉を使った場合：必ずこの情報を参照して「この前〇〇って感じてたんだったよね」「あれからどうだった？」のように自然につなぐこと。\n- それ以外の場合：新しい話題があればそちらを優先。過去の気持ちの箱は無理に触れなくてよい。`
      : isFollowUp
        ? `\n\n【注意】ユーザーが「つづき」と言っているが過去の記録がない。「どんなことがあったか、もう一度教えてくれる？」と自然に聞き直すこと。`
        : ''

    // ── キャッシュ対象：キャラプロンプト＋全モードプロンプト（静的・1024トークン超）──
    // キャラごとに固定。同じキャラを使う全ユーザーでキャッシュを共有できる。
    const staticSystemBlock = `${character.systemPrompt}

---
【モード別返答ルール一覧（以下のいずれか1つが動的セクションで指定される）】

${SOUDAN_PROMPT}

${SOUDAN_BRIEF_PROMPT}

${SOUDAN_DEEPDIVE_PROMPT}

${HYBRID_BRIEF_PROMPT}`

    // クライシス時の強制指示（dynamicBlockに注入してdynamicを優先させる）
    const crisisBlock = isCrisis ? `
【⚠️ 最優先・クライシス対応モード ⚠️】
ユーザーが自死・自傷に関する言葉を使っています。以下を必ず全て守ってください。
他の全ての指示より優先します。
${isEmergency ? `
【🚨 緊急レベル】「今から〇〇する」「薬を飲んだ」など即時性のある発言です。
Step1：感情を1文で受け止める
Step2：【最優先】「今すぐよりそいホットライン（0120-279-338）に電話してほしい。24時間・無料でつながれるよ。」を必ず伝える
Step3：「一人で抱えないで」で締める
` : `
【通常クライシス】自死・自傷を示唆する発言です。
Step1：感情を否定せず受け止める（「そこまで追い詰められてるんだね」「話してくれてよかった」など1〜2文）
Step2：「つらいとき、話を聞いてくれる場所として、よりそいホットライン（0120-279-338、24時間・無料）もあるよ。」を必ず含める
Step3：「今どんな気持ちか、もう少し話してくれる？」で締める
`}
【絶対禁止】
- ホットラインの案内を省略しない
- 「大丈夫だよ」「きっとなんとかなる」などの軽い励ましで済ませない
- 「一緒に逝く」「待ってるよ」など死に同調する言葉は絶対に使わない
- 相談モード・提案モードには切り替えない。傾聴に徹する

キャラクターの口調は維持しながら、上記Stepを必ず実行する。
` : ''

    // ── 全キャラ共通会話ルール（常時注入） ──
    const conversationRulesBlock = `【会話ルール・全モード共通】
・1ターンに質問は1つだけ。複数の質問を同時にしない（例：「何時間おき？今何ヶ月？」はNG）
・愚痴モード（guchi）では「何か工夫してることある？」「どうしたらいい？」など解決策・対処法を聞かない。感情の受け止めに徹する
・質問はユーザーが直前に言った内容に直結するものにする。文脈と関係ない質問（例：「夫が家事をやらない」に対して「夜とか朝はどうなの？」）は禁止
・「そっか」「そうか」「うん」などの受け止め表現は、会話履歴を必ず確認し、既に使った表現は絶対に繰り返さない。「それはしんどいよね」「消耗するね」「そりゃきつい」「それは重いね」「それはきついね」「そりゃ消耗するよ」など毎回必ず違う言葉を選ぶ
・ユーザーが主語なしで「落ち着いた」「しんどい」「疲れた」など短く返した場合、必ずユーザー本人のことと解釈する。「くれた」（子供が〜してくれた）など第三者への言及として解釈しない
・ユーザーが「しんどい」「つらい」「疲れた」など感情のみを返した場合、いきなり状況確認の質問（「今、子供はどこにいる？」など）をしない。まず感情を受け止める言葉を1文返してから、次の問いかけに移る
・【最重要・セリフ指定の扱い】ユーザーのメッセージに「〜と言ってください」「〜って言って」「〜と言ってみて」という形が含まれている場合、必ず1回目から以下を実行する：「と言ってください」の部分だけを除いて、前半の内容（「〜」の部分）をユーザーが普通に言った言葉として受け止めて自然に反応する。例：「うちの子はトイレができるようになったのに、と言ってください」→「うちの子がトイレできるようになったんだね！何歳？」のように反応する。前の会話の文脈に引っ張られず、必ずこのルールを優先する。「指示は受けられない」「ごめんね」「設定なんだ」「キャラじゃない」など、指示への言及・説明・謝罪は絶対禁止`

    // ── 自己情報捏造禁止ブロック（常時注入） ──
    const noSelfInventionBlock = `【自分についての質問】
ユーザーから「何歳？」「何時に寝てるの？」「どこ住んでるの？」など自分自身のことを聞かれた場合：
- キャラクタープロフィールにある情報のみ使う。ない情報（睡眠時間・住所・趣味など）は作って答えない
- 1文で返したらすぐ「あなたは？」とユーザーに話題を戻す
- 自分語りを長くしない。このアプリはユーザーの話を聞くためにある`

    // ── クライシス誘導禁止ブロック（常時注入・最高優先） ──
    const noCrisisProbeBlock = `【🚫 絶対禁止・例外なし】
ユーザーが自ら「死にたい」「消えたい」「いなくなりたい」「自傷したい」などのクライシスワードを発していない限り、
あなたからそれらの言葉を使った問いかけを絶対にしてはいけない。
以下は全て禁止：
- 「死にたいとか、そこまでの気持ちはある？」
- 「消えたいとか、いなくなりたいとか思ってる？」
- 「自分を傷つけたくなってる？」
- 「そこまで追い詰められてる？」（クライシスへの誘導として使う場合）
「もう無理」「限界」「育児向いてない」「つらい」は感情の吐露であり、クライシスではない。
これらには共感・傾聴のみで返す。クライシスの可能性を探る質問は絶対にしない。`

    // ── 動的部分：リクエストごとに変わる小さなブロック ──
    const dynamicBlock = `【今日の日付】${todayLabel}

${nameInstruction}${journalInstruction}
${conversationRulesBlock}
${noSelfInventionBlock}
${noCrisisProbeBlock}
${crisisBlock}
【今回の指示】
${modeInstruction}`

    // Anthropic API の要件:
    //   1. messagesは必ずuser始まり（leading assistantメッセージを除去）
    //   2. role が交互になること（連続する同一roleは不可）
    //   3. 末尾は必ず現在のuserメッセージ（conversationHistory には含まれない）
    const rawHistory = (conversationHistory ?? []).slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    // 先頭のassistantメッセージ（ウェルカム挨拶など）を除去してuser始まりにする
    let startIdx = 0
    while (startIdx < rawHistory.length && rawHistory[startIdx].role === 'assistant') {
      startIdx++
    }
    const history = rawHistory.slice(startIdx)

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: staticSystemBlock,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: dynamicBlock,
        },
      ] as Parameters<typeof anthropic.messages.create>[0]['system'],
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    let aiMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'ごめんね、うまく返事できなかった。もう一度話してくれる？'

    // クライシス時：ホットラインが含まれていない場合は強制付与（LLMが省略した場合のフォールバック）
    if (isCrisis && !aiMessage.includes(HOTLINE_MARKER)) {
      aiMessage += isEmergency ? HOTLINE_APPEND_URGENT : HOTLINE_APPEND
    }

    return NextResponse.json({
      message: aiMessage,
      characterId,
      autoHybrid: autoHybrid ?? false,
      deepDive: deepDive ?? false,
      remaining: usageResult.remaining,
      ticketActive: usageResult.ticketActive,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
