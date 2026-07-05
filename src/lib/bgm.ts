// ─── BGM 曲リスト定義 ─────────────────────────────────────────
export interface BgmTrack {
  id: string
  title: string
  mood: 'chill' | 'happy' | 'emotional' | 'angry'
  emoji: string
  description: string
  file: string
  isActive: boolean
}

export const BGM_TRACKS: BgmTrack[] = [
  { id: 'chill_01',    title: 'やさしい午後',     mood: 'chill',     emoji: '🌿', description: 'チルで落ち着く。深呼吸したくなる曲',             file: 'chill_01.mp3',    isActive: true },
  { id: 'chill_02',    title: '夜の帳',           mood: 'chill',     emoji: '🌙', description: '寝かしつけ後にそっと流したいBGM',               file: 'chill_02.mp3',    isActive: true },
  { id: 'chill_03',    title: 'コーヒーブレイク', mood: 'chill',     emoji: '☕', description: 'ひとりの時間を楽しむ。ゆったりジャズ風',         file: 'chill_03.mp3',    isActive: true },
  { id: 'chill_04',    title: '雨音のなか',       mood: 'chill',     emoji: '🌧️', description: '雨の日にそっと流したい。心が落ち着く',          file: 'chill_04.mp3',    isActive: true },
  { id: 'chill_05',    title: 'ゆるゆる時間',     mood: 'chill',     emoji: '🧸', description: '何もしない贅沢。ぼーっとしたい夜に',            file: 'chill_05.mp3',    isActive: true },
  { id: 'happy_01',    title: '晴れた朝',         mood: 'happy',     emoji: '☀️', description: '今日も頑張れそうな気持ちになる曲',               file: 'happy_01.mp3',    isActive: true },
  { id: 'happy_02',    title: 'きらきらな午後',   mood: 'happy',     emoji: '✨', description: '子どもの笑顔を思い出すような明るい曲',          file: 'happy_02.mp3',    isActive: true },
  { id: 'happy_03',    title: 'お散歩日和',       mood: 'happy',     emoji: '🌈', description: '外に出たくなる。軽やかで前向きな気分に',        file: 'happy_03.mp3',    isActive: true },
  { id: 'emotional_01',title: '泣いてもいい',     mood: 'emotional', emoji: '💧', description: '感情を解放したいときに。泣いても大丈夫',         file: 'emotional_01.mp3',isActive: true },
  { id: 'emotional_02',title: 'ひとりの夜に',     mood: 'emotional', emoji: '🌌', description: '静かに涙を流したい夜。自分に正直になれる',       file: 'emotional_02.mp3',isActive: true },
  { id: 'emotional_03',title: '心のうた',         mood: 'emotional', emoji: '🫂', description: '誰かに抱きしめてもらうような温かさ',             file: 'emotional_03.mp3',isActive: true },
  { id: 'angry_01',    title: 'ぶちまけタイム',   mood: 'angry',     emoji: '🔥', description: 'イライラ爆発。ストレスを全部吐き出せ',           file: 'angry_01.mp3',    isActive: true },
  { id: 'angry_02',    title: 'スカッとタイム',   mood: 'angry',     emoji: '💢', description: '今日の怒りをここで全部発散。遠慮なく',          file: 'angry_02.mp3',    isActive: true },
  { id: 'angry_03',    title: '爆発寸前',         mood: 'angry',     emoji: '🌪️', description: '限界突破。叫びたい気持ちを音に乗せて',          file: 'angry_03.mp3',    isActive: true },
]

export const getActiveTracks = (): BgmTrack[] => BGM_TRACKS.filter(t => t.isActive)
export const getTrackById = (id: string): BgmTrack | undefined => BGM_TRACKS.find(t => t.id === id)
export const getTrackByIdIncludeInactive = (id: string): BgmTrack | undefined => BGM_TRACKS.find(t => t.id === id)
export const getTracksByMood = (mood: BgmTrack['mood']): BgmTrack[] => BGM_TRACKS.filter(t => t.isActive && t.mood === mood)

export const BGM_FAVORITES_KEY = 'fuu_bgm_favorites'
export const BGM_ENABLED_KEY   = 'fuu_bgm_enabled'

export function getFavoriteIds(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(BGM_FAVORITES_KEY) ?? '[]') } catch { return [] }
}
export function addFavorite(id: string): void {
  const f = getFavoriteIds()
  if (!f.includes(id)) localStorage.setItem(BGM_FAVORITES_KEY, JSON.stringify([...f, id]))
}
export function removeFavorite(id: string): void {
  localStorage.setItem(BGM_FAVORITES_KEY, JSON.stringify(getFavoriteIds().filter(f => f !== id)))
}
export function toggleFavorite(id: string): boolean {
  if (getFavoriteIds().includes(id)) { removeFavorite(id); return false }
  addFavorite(id); return true
}
