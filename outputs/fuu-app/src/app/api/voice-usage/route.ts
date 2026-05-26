import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * 音声使用時間トラッキング API
 *
 * GET  /api/voice-usage  → 本日の使用秒数を返す
 * POST /api/voice-usage  → 使用秒数を加算する
 *
 * チケット利用時：1日30分（1800秒）上限
 * プレミアム月額：1ヶ月30分（month_seconds）上限
 */

const TICKET_DAILY_LIMIT_SEC = 30 * 60  // 30分 = 1800秒

// 今日の日付文字列（JST）
function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ usedSeconds: 0, limitSeconds: TICKET_DAILY_LIMIT_SEC, canUse: true })
    }

    const today = todayJST()

    const { data } = await supabase
      .from('voice_usage')
      .select('used_seconds')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .single()

    const used = data?.used_seconds ?? 0
    return NextResponse.json({
      usedSeconds: used,
      limitSeconds: TICKET_DAILY_LIMIT_SEC,
      remainingSeconds: Math.max(0, TICKET_DAILY_LIMIT_SEC - used),
      canUse: used < TICKET_DAILY_LIMIT_SEC,
    })
  } catch {
    return NextResponse.json({
      usedSeconds: 0,
      limitSeconds: TICKET_DAILY_LIMIT_SEC,
      remainingSeconds: TICKET_DAILY_LIMIT_SEC,
      canUse: true,
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seconds } = await req.json()

    if (!seconds || seconds <= 0 || seconds > 3600) {
      return NextResponse.json({ error: '無効な秒数です' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      // 未ログイン時はフロントのlocalStorageで管理（デモモード）
      return NextResponse.json({ ok: true, demo: true })
    }

    const today = todayJST()
    const userId = session.user.id

    // upsert: 今日のレコードがあれば加算、なければ作成
    const { data: existing } = await supabase
      .from('voice_usage')
      .select('id, used_seconds')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existing) {
      const newTotal = existing.used_seconds + seconds
      await supabase
        .from('voice_usage')
        .update({ used_seconds: newTotal, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      return NextResponse.json({
        ok: true,
        usedSeconds: newTotal,
        canUse: newTotal < TICKET_DAILY_LIMIT_SEC,
      })
    } else {
      await supabase.from('voice_usage').insert({
        user_id: userId,
        date: today,
        used_seconds: seconds,
      })

      return NextResponse.json({
        ok: true,
        usedSeconds: seconds,
        canUse: seconds < TICKET_DAILY_LIMIT_SEC,
      })
    }
  } catch (error) {
    console.error('Voice usage tracking error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
