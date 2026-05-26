// ─── キャラクター型 ───────────────────────────────────────────
export type CharacterId = 'aoi' | 'sakura' | 'rika' | 'natsuko' | 'kenji' | 'hiroshi'

export interface Character {
  id: CharacterId
  name: string
  age: number
  role: string
  personality: string
  speechStyle: string
  avatar: string        // /public/characters/{id}.png
  color: string         // Tailwindクラス用メインカラー
  bgColor: string
  isPremium: boolean    // trueはプレミアム以上のみ
  isAvailable: boolean  // falseは将来実装
  /**
   * ユーザーのアカウント作成日からの経過月数で解放されるキャラ。
   * 0 = 初日から利用可能、1 = 1ヶ月後に解放、2 = 2ヶ月後に解放
   * isPremiumと組み合わせて判定する（プレミアム かつ 利用期間を満たす）
   */
  unlockAfterMonths: number
  systemPrompt: string
}

// ─── キャラクター解放チェック ──────────────────────────────────
export interface CharacterUnlockStatus {
  character: Character
  isUnlocked: boolean
  /** 解放まで残り何日か（未解放の場合のみ） */
  daysUntilUnlock?: number
  /** 解放まで残り何ヶ月か（未解放の場合のみ） */
  monthsUntilUnlock?: number
}

// ─── BGM型 ────────────────────────────────────────────────────
export type BgmId = string

export interface BgmTrack {
  id: BgmId
  title: string
  /** チル / 明るい / 夜向け など */
  mood: 'chill' | 'upbeat' | 'night' | 'morning'
  /** /public/bgm/{filename}.mp3 */
  src: string
  /** アプリ追加月（YYYY-MM形式）。お気に入り登録した曲はこの値に関わらず保持 */
  addedMonth: string
  /** 翌月以降のアップデートで入れ替え対象になるか。falseは永続保持 */
  isRotatable: boolean
}

// ─── ユーザー・プラン型 ───────────────────────────────────────
export type PlanType = 'free' | 'standard' | 'premium'

export interface UserProfile {
  id: string
  email: string
  plan: PlanType
  trialEndAt: string | null
  stripeCustomerId: string | null
  createdAt: string
}

// ─── メッセージ型 ─────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
  isVoice?: boolean
}

// ─── 会話型 ───────────────────────────────────────────────────
export interface Conversation {
  id: string
  userId: string
  characterId: CharacterId
  title: string | null
  lastMessageAt: string
  createdAt: string
}

// ─── 愚痴ジャーナル型 ─────────────────────────────────────────
export interface GuchiJournal {
  id: string
  userId: string
  conversationId: string
  originalContent: string   // 愚痴の元テキスト
  reframed: string          // AIが変換した「宝箱」テキスト
  date: string
  createdAt: string
}

// ─── サブスクリプション型 ─────────────────────────────────────
export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  plan: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string
}

// ─── 音声通話チケット設定 ─────────────────────────────────────
/**
 * ¥300チケットによる音声通話の時間制限設定。
 * 将来の拡張を想定して定数化する。
 *
 * ロードマップ：
 *   Phase 1（ローンチ）  : TICKET_VOICE_LIMIT_MINUTES = 30
 *   Phase 2（黒字化後）  : TICKET_VOICE_LIMIT_MINUTES = 60
 *   Phase 3（安定期）    : TICKET_VOICE_LIMIT_MINUTES = 120  or 無制限
 *
 * 変更時はこの定数を書き換えるだけで全体に反映される。
 */
export const TICKET_VOICE_LIMIT_MINUTES = 30  // 現在：30分上限

/** チケット残り時間の警告を出すタイミング（分前） */
export const TICKET_VOICE_WARNING_MINUTES = 5

/** 月間チケット購入・使用の上限枚数 */
export const TICKET_MONTHLY_CAP = 3

// ─── APIレスポンス型 ──────────────────────────────────────────
export interface ApiError {
  error: string
  code?: string
}

export interface ChatRequest {
  conversationId: string
  characterId: CharacterId
  message: string
  nickname?: string
  conversationHistory: Array<{ role: MessageRole; content: string }>
}

export interface ChatResponse {
  message: string
  conversationId: string
}
