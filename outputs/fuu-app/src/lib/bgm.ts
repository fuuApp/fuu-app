// ─── BGM 曲リスト定義 ─────────────────────────────────────────
// ローンチ時は3〜5曲を事前制作してアプリに同梱。
// 月次アップデートで曲を追加・入れ替え。
// お気に入り登録した曲は入れ替えても保持される。

export interface BgmTrack {
  id: string          // 曲の一意ID（DBに保存するキー。絶対に変更しない）
  title: string       // 表示タイトル
  mood: 'chill' | 'happy' | 'emotional'  // ムードカテゴリ
  emoji: string       // UI表示用の絵文字
  description: string // 曲の雰囲気説明
  file: string        // /public/bgm/ 以下のファイル名
  isActive: boolean   // falseにすると月次更新で非表示（お気に入り登録者は引き続き聴ける）
}

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'chill_01',
    title: 'やさしい午後',
    mood: 'chill',
    emoji: '🌿',
    description: 'チルで落ち着く。深呼吸したくなる曲',
    file: 'chill_01.mp3',
    isActive: true,
  },
  {
    id: 'chill_02',
    title: '夜の帳',
    mood: 'chill',
    emoji: '🌙',
    description: '寝かしつけ後にそっと流したいBGM',
    file: 'chill_02.mp3',
    isActive: true,
  },
  {
    id: 'happy_01',
    title: '晴れた朝',
    mood: 'happy',
    emoji: '☀️',
    description: '今日も頑張れそうな気持ちになる曲',
    file: 'happy_01.mp3',
    isActive: true,
  },
  {
    id: 'emotional_01',
    title: '泣いてもいい',
    mood: 'emotional',
    emoji: '🌧️',
    description: '感情を解放したいときに。泣いても大丈夫',
    file: 'emotional_01.mp3',
    isActive: true,
  },
  {
    id: 'chill_03',
    title: 'コーヒーブレイク',
    mood: 'chill',
    emoji: '☕',
    description: 'ひとりの時間を楽しむ。ゆったりジャズ風',
    file: 'chill_03.mp3',
    isActive: true,
  },
]

export const getActiveTracks = (): BgmTrack[] =>
  BGM_TRACKS.filter(t => t.isActive)

export const getTrackById = (id: string): BgmTrack | undefined =>
  BGM_TRACKS.find(t => t.id === id)

// お気に入り登録されているがisActive=falseの曲も取得（お気に入りユーザー向け）
export const getTrackByIdIncludeInactive = (id: string): BgmTrack | undefined =>
  BGM_TRACKS.find(t => t.id === id)

// ムードでフィルタ
export const getTracksByMood = (mood: BgmTrack['mood']): BgmTrack[] =>
  BGM_TRACKS.filter(t => t.isActive && t.mood === mood)

// localStorage キー
export const BGM_FAVORITES_KEY = 'fuu_bgm_favorites'
export const BGM_ENABLED_KEY = 'fuu_bgm_enabled'

// お気に入り取得（localStorage）
export function getFavoriteIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(BGM_FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// お気に入り追加
export function addFavorite(id: string): void {
  const favs = getFavoriteIds()
  if (!favs.includes(id)) {
    localStorage.setItem(BGM_FAVORITES_KEY, JSON.stringify([...favs, id]))
  }
}

// お気に入り削除
export function removeFavorite(id: string): void {
  const favs = getFavoriteIds().filter(f => f !== id)
  localStorage.setItem(BGM_FAVORITES_KEY, JSON.stringify(favs))
}

// お気に入りトグル
export function toggleFavorite(id: string): boolean {
  const favs = getFavoriteIds()
  if (favs.includes(id)) {
    removeFavorite(id)
    return false
  } else {
    addFavorite(id)
    return true
  }
}
