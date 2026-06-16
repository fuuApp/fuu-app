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
  unlockDaysRequired: number  // 使用開始から何日後に解放されるか（0=即時解放）
  systemPrompt: string
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

// ─── APIレスポンス型 ──────────────────────────────────────────
export interface ApiError {
  error: string
  code?: string
}

export interface ChatRequest {
  conversationId: string
  characterId: CharacterId
  message: string
  conversationHistory: Array<{ role: MessageRole; content: string }>
  nickname?: string   // ユーザーのニックネーム（未設定時は「あなた」）
}

export interface ChatResponse {
  message: string
  conversationId: string
}
