/**
 * プッシュ通知送信API
 *
 * 【必要な環境変数】
 *   FIREBASE_PROJECT_ID     : FirebaseプロジェクトID
 *   FIREBASE_CLIENT_EMAIL   : Firebase Admin SDKのサービスアカウントメール
 *   FIREBASE_PRIVATE_KEY    : Firebase Admin SDKの秘密鍵（\nをそのまま含む文字列）
 *
 * 【呼び出し方】
 *   POST /api/notification/send
 *   Body: { userId: string, title: string, body: string, data?: Record<string, string> }
 *   ※ Supabase ServiceRoleキー必須（サーバー間通信のみ）
 *
 * 【使用箇所の例】
 *   - pg_cron（朝/夜の定期通知）
 *   - 会話終了時の翌朝リマインダー
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// ── FCM HTTP v1 アクセストークン取得 ─────────────────────────────
async function getFirebaseAccessToken(): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library')
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL!,
      private_key: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  return tokenResponse.token ?? ''
}

// ── FCM HTTP v1 でプッシュ通知を送信 ──────────────────────────────
async function sendFcmNotification({
  token,
  title,
  body,
  data,
}: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID!
  const accessToken = await getFirebaseAccessToken()

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data ?? {},
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
          android: {
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`FCM error: ${err}`)
  }
}

// ── POST ハンドラ ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // このAPIはサーバー間通信のみ（Service Roleキーをヘッダーで確認）
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, title, body, data } = await req.json()
    if (!userId || !title || !body) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    // Firebase環境変数チェック
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Firebase環境変数が設定されていません（FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY）' },
        { status: 503 }
      )
    }

    // push_tokenを取得
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('push_token, notification_time, morning_time')
      .eq('id', userId)
      .single()

    if (!profile?.push_token) {
      return NextResponse.json({ skipped: true, reason: 'push_tokenが未設定' })
    }

    await sendFcmNotification({ token: profile.push_token, title, body, data })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: error.message ?? 'プッシュ通知の送信に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 複数ユーザーへの一括送信（pg_cronからの呼び出し用）
 * POST /api/notification/send/bulk
 */
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await req.json() // type: 'morning' | 'evening'
    const isMorning = type === 'morning'

    const admin = createAdminClient()
    const now = new Date()
    const jstHour = (now.getUTCHours() + 9) % 24

    // push_tokenがあるユーザー全員に送信
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, push_token')
      .not('push_token', 'is', null)

    if (!profiles?.length) return NextResponse.json({ success: true, sent: 0 })

    const title = isMorning ? '☀️ おはよう！今日も一緒にがんばろ' : '🌙 今日はどんな日だった？'
    const body = isMorning
      ? 'ふぅに今日のことを話してみよう'
      : '今日あったこと、ふぅに話してみて。聞いてるよ'

    let sent = 0
    const errors: string[] = []

    await Promise.allSettled(
      profiles
        .filter(p => p.push_token)
        .map(async p => {
          try {
            await sendFcmNotification({ token: p.push_token!, title, body })
            sent++
          } catch (err: any) {
            errors.push(`${p.id}: ${err.message}`)
          }
        })
    )

    return NextResponse.json({ success: true, sent, errors: errors.slice(0, 10) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
