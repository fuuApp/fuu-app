'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllCharacters } from '@/lib/characters'
import { createClient } from '@/lib/supabase'
import type { Character } from '@/types'

const PLAN_CACHE_KEY = 'fuu_plan'

// 新規追加した16体のID（NEWバッジ対象）
const NEW_CHAR_IDS = new Set([
  'yui','mio','haruka','tomomi','ayaka','noriko',
  'kazuko','michiko','yoko','akiko','reiko',
  'sota','takashi','daisuke','yusuke','koji',
])
const NEW_BADGE_DAYS = 7

function calcUsageDays(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0
  return Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / (1000 * 60 * 60 * 24))
}

function calcUsageMonths(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0
  const start = new Date(trialStartedAt)
  const now = new Date()
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    (now.getDate() >= start.getDate() ? 0 : -1)
  return Math.max(0, months)
}

function charEmoji(id: string): string {
  const map: Record<string, string> = {
    aoi: '👧', sakura: '🌸', rika: '💪', natsuko: '🍵', kenji: '👨', hiroshi: '🧔',
  }
  return map[id] ?? '👤'
}

function CharAvatar({ c, size = 56 }: { c: Character; size?: number }) {
  const avatarStyle: React.CSSProperties = {
    width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: c.isPremium
        ? 'linear-gradient(135deg,#C2185B,#880E4F)'
        : 'linear-gradient(135deg,#E91E63,#F48FB1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.46, color: '#fff',
    }}>
      {c.avatar
        ? <img src={c.avatar} alt={c.name} style={avatarStyle}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        : charEmoji(c.id)}
    </div>
  )
}

export default function CharacterSelectPage() {
  const [usageDays, setUsageDays] = useState(0)
  const [usageMonths, setUsageMonths] = useState(0)
  const [plan, setPlan] = useState<string>('free')
  const [mounted, setMounted] = useState(false)
  const [newCharIds, setNewCharIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // まずlocalStorageキャッシュで即時表示（UI遅延防止）
    const cached = localStorage.getItem(PLAN_CACHE_KEY)
    if (cached) setPlan(cached)

    // Supabaseから最新プラン・trial_started_atを取得
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan, trial_started_at')
            .eq('user_id', user.id)
            .single()
          if (profile?.plan) {
            setPlan(profile.plan)
            localStorage.setItem(PLAN_CACHE_KEY, profile.plan)
          }
          // 使用日数・月数はSupabaseのtrial_started_atから計算
          const startedAt = profile?.trial_started_at ?? null
          setUsageDays(calcUsageDays(startedAt))
          setUsageMonths(calcUsageMonths(startedAt))
        }
      } catch {
        // 失敗時は0のまま
      }
    })()

    setMounted(true)
  }, [])

  const allCharacters = getAllCharacters().filter(c => c.isAvailable)

  // plan状態の分類
  // 'trial'/'free' → トライアル中
  // 'standard'/'premium' → 有料プラン中
  // 'canceled' → 有料プラン解約後（期末到達済み）
  const isTrial = plan === 'free' || plan === 'trial'
  const isCanceled = plan === 'canceled'
  const isPaid = plan === 'standard' || plan === 'premium'
  const trialExpired = isTrial && usageDays >= 10

  // ── 解放条件判定 ───────────────────────────────────────────────
  // あおい・さくら（isPremium:false, unlockAfterMonths:0）         → 全プラン常時解放
  // りか・なつこ（isPremium:false, unlockDaysRequired:0, months:0）→ スタンダード以上
  // スタンダード解放キャラ（isPremium:false, unlockAfterMonths>0） → スタンダード以上 + N ヶ月後
  // プレミアム解放キャラ（isPremium:true, unlockAfterMonths>0）    → プレミアム + N ヶ月後
  // けんじ・ひろし（isPremium:true, unlockAfterMonths:3）          → プレミアム + 3ヶ月後
  const isLocked = (c: Character): boolean => {
    if (!c.isPremium && c.unlockAfterMonths === 0 && c.unlockDaysRequired === 0) {
      // あおい・さくら：常時解放（りか・なつこも現状ここに入るがスタンダード要件を適用）
      // りか・なつこ判別：unlockDaysRequired===0 かつ role/id で区別する代わりに isPaid で制御
      // ※ りか・なつこは id で特定するよりも将来的な変更に備え isPaid で制御
      if (c.id === 'aoi' || c.id === 'sakura') return false
      return !isPaid  // りか・なつこ
    }
    if (c.isPremium) {
      if (plan !== 'premium') return true
      return usageMonths < c.unlockAfterMonths
    }
    // スタンダード解放キャラ
    if (!isPaid) return true
    return usageMonths < c.unlockAfterMonths
  }

  // ── NEWバッジ判定：初回アンロック日時をlocalStorageに記録し7日間表示 ──
  useEffect(() => {
    if (!mounted) return
    const allChars = getAllCharacters().filter(c => c.isAvailable)
    const now = Date.now()
    const newSet = new Set<string>()

    for (const c of allChars) {
      if (!NEW_CHAR_IDS.has(c.id)) continue       // 新16体以外はスキップ
      if (isLocked(c)) continue                    // まだロック中はスキップ

      const key = `fuu_char_new_${c.id}`
      const stored = localStorage.getItem(key)

      if (!stored) {
        // 初回アンロック → 日時を記録
        localStorage.setItem(key, now.toString())
        newSet.add(c.id)
      } else {
        const daysSince = (now - parseInt(stored)) / (1000 * 60 * 60 * 24)
        if (daysSince < NEW_BADGE_DAYS) newSet.add(c.id)
      }
    }
    setNewCharIds(newSet)
  }, [mounted, usageMonths, plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const unlockLabel = (c: Character): string => {
    if (c.isPremium) {
      if (plan !== 'premium') return 'プレミアムで解放'
      if (usageMonths < c.unlockAfterMonths) return `プレミアム${c.unlockAfterMonths}ヶ月後に解放`
    } else {
      if (!isPaid) return 'スタンダードで解放'
      if (usageMonths < c.unlockAfterMonths) return `スタンダード${c.unlockAfterMonths}ヶ月後に解放`
    }
    return ''
  }

  if (!mounted) return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
        <span style={{ fontSize: 14, color: '#E91E63' }}>読み込み中...</span>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff', borderBottom: '1px solid #FCE4EC',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <img src="/icons/icon_c.png" alt="fuu" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <span style={{ fontWeight: 700, fontSize: 17, color: '#E91E63' }}>fuu ふぅ</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>話したいコを選んでね</span>
        <Link href="/app/settings" style={{
          marginLeft: 12, fontSize: 20, textDecoration: 'none', lineHeight: 1, color: '#bbb',
        }} title="設定">⚙️</Link>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 16, textAlign: 'center' }}>
          今日は誰に話す？
        </p>

        {/* 解約後バナー */}
        {isCanceled && (
          <div style={{
            background: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)',
            borderRadius: 14, padding: '14px 16px',
            marginBottom: 16, border: '1.5px solid #CE93D8',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6A1B9A', marginBottom: 6 }}>
              💜 プランが終了しました
            </div>
            <p style={{ fontSize: 12, color: '#4A148C', margin: '0 0 10px', lineHeight: 1.7 }}>
              またふぅと話したいときは、プランを選んでください。いつでも再開できます。
            </p>
            <Link href="/app/plans" style={{
              display: 'inline-block', background: '#7B1FA2', color: '#fff',
              fontSize: 13, fontWeight: 700, padding: '8px 18px',
              borderRadius: 20, textDecoration: 'none',
            }}>
              プランを選ぶ →
            </Link>
          </div>
        )}

        {/* トライアル終了バナー */}
        {trialExpired && (
          <div style={{
            background: 'linear-gradient(135deg,#FCE4EC,#F8BBD9)',
            borderRadius: 14, padding: '14px 16px',
            marginBottom: 16, border: '1.5px solid #F48FB1',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#C2185B', marginBottom: 6 }}>
              🌸 無料トライアルが終了しました
            </div>
            <p style={{ fontSize: 12, color: '#880E4F', margin: '0 0 10px', lineHeight: 1.7 }}>
              引き続きふぅと話すには、プランを選んでください。いつでも解約できます。
            </p>
            <Link href="/app/plans" style={{
              display: 'inline-block', background: '#E91E63', color: '#fff',
              fontSize: 13, fontWeight: 700, padding: '8px 18px',
              borderRadius: 20, textDecoration: 'none',
            }}>
              プランを選ぶ →
            </Link>
          </div>
        )}

        {/* 使用日数バッジ */}
        {usageDays > 0 && !trialExpired && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '8px 16px',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 1px 6px rgba(233,30,99,0.07)',
          }}>
            <span style={{ fontSize: 15 }}>📅</span>
            <span style={{ fontSize: 12, color: '#888' }}>
              使用開始から <strong style={{ color: '#E91E63' }}>{usageDays}日目</strong>
            </span>
          </div>
        )}

        {allCharacters.map(c => {
          const locked = isLocked(c)

          if (locked) {
            return (
              <div key={c.id} style={{
                background: '#f5f5f5', borderRadius: 18, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 12, border: '1.5px solid #eee', opacity: 0.65,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: '#ddd', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 26, overflow: 'hidden', position: 'relative',
                }}>
                  {c.avatar && (
                    <img src={c.avatar} alt={c.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <span style={{ position: 'absolute', fontSize: 22 }}>🔒</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#bbb' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>{c.age}歳</span>
                    {c.isPremium && (
                      <span style={{ fontSize: 10, background: '#e0e0e0', color: '#999', padding: '2px 8px', borderRadius: 20 }}>プレミアム</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', marginBottom: 6 }}>{c.role}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#FCE4EC', borderRadius: 20, padding: '3px 10px',
                    fontSize: 11, color: '#E91E63', fontWeight: 700,
                  }}>
                    ⏳ {unlockLabel(c)}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link key={c.id} href={`/app/chat/${c.id}`}
              style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
            >
              <div style={{
                background: '#fff', borderRadius: 18, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 2px 10px rgba(233,30,99,0.08)',
                border: '1.5px solid transparent', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#F48FB1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
              >
                <CharAvatar c={c} size={56} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>{c.age}歳</span>
                    {newCharIds.has(c.id) && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: 'linear-gradient(135deg,#FF6F00,#FF8F00)',
                        color: '#fff', padding: '2px 8px', borderRadius: 20,
                        letterSpacing: '0.04em',
                      }}>NEW</span>
                    )}
                    {c.isPremium && (
                      <span style={{
                        fontSize: 10, background: 'linear-gradient(135deg,#C2185B,#880E4F)',
                        color: '#fff', padding: '2px 8px', borderRadius: 20,
                      }}>プレミアム</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#E91E63', marginBottom: 3 }}>{c.role}</div>
                  <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
                    {c.speechStyle.split('。')[0]}
                  </div>
                </div>
                <span style={{ fontSize: 18, color: '#F48FB1' }}>›</span>
              </div>
            </Link>
          )
        })}

        {/* ─── クイックアクセス ─── */}
        <div style={{ marginTop: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>
            QUICK ACCESS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { href: '/app/journal', icon: '✨', label: '気持ちの箱を見る', sub: '過去の気持ち記録', color: '#FFF0F5', border: '#F8BBD9' },
              { href: '/app/bgm', icon: '🎵', label: 'BGM', sub: '癒やしの音楽', color: '#F3E5F5', border: '#CE93D8' },
              { href: '/app/plans', icon: '🌸', label: 'プランを見る', sub: 'アップグレード', color: '#FCE4EC', border: '#F48FB1' },
              { href: '/app/settings', icon: '⚙️', label: '設定', sub: '呼び名・BGMなど', color: '#F5F5F5', border: '#E0E0E0' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: item.color, border: `1px solid ${item.border}`,
                  borderRadius: 14, padding: '12px 14px',
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.opacity = '0.8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{item.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
