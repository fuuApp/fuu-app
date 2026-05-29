import { useEffect, useRef } from 'react'

const BGM_FILES = [
  '/bgm/chill_01.mp3',
  '/bgm/chill_02.mp3',
  '/bgm/chill_03.mp3',
  '/bgm/happy_01.mp3',
  '/bgm/emotional_01.mp3',
]

/**
 * チャット中にBGMをランダムで自動再生するフック。
 * - コンポーネントマウント時に再生開始
 * - アンマウント時に停止・解放
 * - BGMファイルが存在しない場合は無音で続行（エラーなし）
 */
export function useBgm() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const randomFile = BGM_FILES[Math.floor(Math.random() * BGM_FILES.length)]
    const audio = new Audio(randomFile)
    audio.loop = true
    audio.volume = 0.3

    audioRef.current = audio

    // ファイルが存在しない場合はエラーを無視して続行
    audio.play().catch(() => {
      // BGMファイル未設置などの場合は静かに無視
    })

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])
}
