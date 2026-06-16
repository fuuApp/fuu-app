'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  BGM_ENABLED_KEY,
  BGM_FAVORITES_KEY,
  getActiveTracks,
  type BgmTrack,
} from '@/lib/bgm'

/**
 * useBgm — チャット中のBGM再生管理フック
 *
 * 動作:
 * 1. BGM有効フラグ (localStorage) を確認
 * 2. お気に入り曲があればその中からランダム選択、なければアクティブ曲からランダム選択
 * 3. Audio APIでループ再生（ページ離脱時に停止）
 * 4. ブラウザの自動再生ポリシー対応: ユーザー操作後に開始
 *
 * 使用方法:
 *   const { startBgm, stopBgm } = useBgm()
 *   // ユーザーが最初に送信したタイミングで startBgm() を呼ぶ
 */
export function useBgm() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef(false)

  const selectTrack = useCallback((): BgmTrack | null => {
    const enabled = localStorage.getItem(BGM_ENABLED_KEY)
    if (enabled === 'false') return null

    // お気に入りが設定されていればそちらを優先
    let pool: BgmTrack[] = []
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem(BGM_FAVORITES_KEY) ?? '[]')
      const active = getActiveTracks()
      const favActive = active.filter(t => favIds.includes(t.id))
      pool = favActive.length > 0 ? favActive : active
    } catch {
      pool = getActiveTracks()
    }

    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  const startBgm = useCallback(() => {
    if (playingRef.current) return
    if (typeof window === 'undefined') return

    const track = selectTrack()
    if (!track) return

    try {
      const audio = new Audio(`/bgm/${track.file}`)
      audio.loop = true
      audio.volume = 0.25  // チャットの邪魔にならない音量
      audio.play().then(() => {
        playingRef.current = true
      }).catch(() => {
        // 自動再生ブロックされた場合は無視（ユーザー操作後に再試行可能）
      })
      audioRef.current = audio
    } catch {
      // Audio API非対応環境では何もしない
    }
  }, [selectTrack])

  const stopBgm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    playingRef.current = false
  }, [])

  const toggleBgm = useCallback(() => {
    if (playingRef.current) {
      stopBgm()
    } else {
      startBgm()
    }
  }, [startBgm, stopBgm])

  // ページ離脱時に停止
  useEffect(() => {
    return () => {
      stopBgm()
    }
  }, [stopBgm])

  // バックグラウンド（非表示）時に停止、復帰時に再開
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        audioRef.current?.pause()
      } else {
        if (playingRef.current && audioRef.current) {
          audioRef.current.play().catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return { startBgm, stopBgm, toggleBgm }
}
