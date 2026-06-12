'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllCharacters } from '@/lib/characters'
import { createClient } from '@/lib/supabase'
import type { Character } from '@/types'

const PLAN_CACHE_KEY = 'fuu_plan'

function calcUsageDays(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0
  return Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / (1000 * 60 * 60 * 24))
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
  const [plan, setPlan] = useState<string>('free')
  const [mounted, setMounted] = useState(false)

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
          // 使用日数はSupabaseのtrial_started_atから計算
          setUsageDays(calcUsageDays(profile?.trial_started_at ?? null))
        }
      } catch {
        // 失敗時は0のまま
      }
    })()

    setMounted(true)
  }, [])

  const allCharacters = getAllCharacters().filter(c => c.isAvailable)

  // 解放条件：サブスクプランで判定
  // あおい・さくら：無料トライアルから（常に解放）
  // りか・なつこ：スタンダード以上
  // けんじ・ひろし：プレミアムのみ
  const isLocked = (c: Character): boolean => {
    if (!c.isPremium && c.unlockDaysRequired === 0) return false // あおい・さくら
    if (c.isPremium) return plan !== 'premium'  // けんじ・ひろし
    // りか・なつこ（isPremium:false かつ unlockDaysRequired:0 だが将来的にstandard制限）
    return plan === 'free' && usageDays < 10    // トライアル10日以内はりか・なつこもロック
  }

  const unlockLabel = (c: Character): string => {
    if (c.isPremium) return 'プレミアムで解放'
    if (isLocked(c)) return 'スタンダードで解放'
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

        {/* 使用日数バッジ */}
        {usageDays > 0 && (
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
