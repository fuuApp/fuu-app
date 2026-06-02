import { NextRequest, NextResponse } from 'next/server'

const DAILY_LIMIT_SEC = 1800 // 30分

// 簡易実装: メモリ管理（本番はSupabaseに移行推奨）
const usageMap = new Map<string, { date: string; usedSeconds: number }>()

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'anonymous'
  const today = getTodayKey()
  const usage = usageMap.get(userId)

  if (!usage || usage.date !== today) {
    return NextResponse.json({
      usedSeconds: 0,
      remainingSeconds: DAILY_LIMIT_SEC,
      canUse: true,
    })
  }

  const remaining = Math.max(0, DAILY_LIMIT_SEC - usage.usedSeconds)
  return NextResponse.json({
    usedSeconds: usage.usedSeconds,
    remainingSeconds: remaining,
    canUse: remaining > 0,
  })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'anonymous'
  const today = getTodayKey()
  const { seconds = 0 } = await req.json()

  const current = usageMap.get(userId)
  const usedSeconds = (current?.date === today ? current.usedSeconds : 0) + seconds
  usageMap.set(userId, { date: today, usedSeconds })

  const remaining = Math.max(0, DAILY_LIMIT_SEC - usedSeconds)
  return NextResponse.json({
    usedSeconds,
    remainingSeconds: remaining,
    canUse: remaining > 0,
  })
}
