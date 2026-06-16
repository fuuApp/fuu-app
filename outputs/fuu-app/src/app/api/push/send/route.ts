import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

/**
 * GET  /api/push/send  — Vercel Cron から自動実行（朝/夜を時刻で自動判定）
 * POST /api/push/send  — 管理者が手動実行（body: { type, adminSecret }）
 *
 * 朝・夜ボイス通知を登録ユーザーに一斉送信する。
 *
 * vercel.json 設定:
 * "crons": [
 *   { "path": "/api/push/send", "schedule": "0 22 * * *" },  // 07:00 JST
 *   { "path": "/api/push/send", "schedule": "0 12 * * *" }   // 21:00 JST
 * ]
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

type PushType = 'morning' | 'evening'

const PUSH_MESSAGES: Record<PushType, { title: string; body: string }> = {
  morning: {
    title: '🌸 おはよう！ふぅだよ',
    body: '今日も一日、どんなことがあっても話を聞くよ☀️',
  },
  evening: {
    title: '🌙 おやすみ前に少し話さない？',
    body: '今日の気持ち、ふぅに話してみて。そっと聞くよ',
  },
}

async function sendExpoPushNotification(tokens: string[], type: PushType) {
  const message = PUSH_MESSAGES[type]
  const messages = tokens.map(token => ({
    to: token,
    title: message.title,
    body: message.body,
    sound: 'default',
    data: { type, screen: '/app' },
    categoryId: 'fuu_voice',
  }))

  const batchSize = 100
  const results = []
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(batch),
    })
    if (res.ok) {
      const data = await res.json()
      results.push(...(data.data ?? []))
    }
  }
  return results
}

async function runPushSend(type: PushType): Promise<NextResponse> {
  const supabase = createAdminClient()

  const nowHHMM = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().slice(11, 16)  // "HH:MM" JST

  const timeColumn = type === 'morning' ? 'morning_time' : 'notification_time'

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('push_token')
    .eq(timeColumn, nowHHMM)
    .not('push_token', 'is', null)

  if (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 })
  }

  const tokens = (profiles ?? [])
    .map((p: { push_token: string | null }) => p.push_token)
    .filter((t): t is string => !!t)

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: '対象ユーザーなし' })
  }

  const results = await sendExpoPushNotification(tokens, type)

  return NextResponse.json({
    ok: true,
    type,
    sent: tokens.length,
    results: results.length,
  })
}

// Vercel CronはGETリクエストを使用する
export async function GET(req: NextRequest) {
  if (req.headers.get('x-vercel-cron') !== '1') {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  // 現在時刻（JST）から朝/夜を判定
  const hour = parseInt(new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(11, 13))
  const type: PushType = hour < 12 ? 'morning' : 'evening'

  try {
    return await runPushSend(type)
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

// 管理者による手動実行
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET が設定されていません' }, { status: 503 })
  }

  try {
    const { type, adminSecret: reqSecret } = await req.json()

    if (reqSecret !== adminSecret) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 })
    }

    if (type !== 'morning' && type !== 'evening') {
      return NextResponse.json({ error: 'type は morning か evening を指定してください' }, { status: 400 })
    }

    return await runPushSend(type as PushType)
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
