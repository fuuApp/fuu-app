/**
 * プッシュ通知送信API
 *
 * 【必要な環境変数（Vercel Dashboard で設定）】
 *   FIREBASE_PROJECT_ID     : FirebaseプロジェクトID
 *   FIREBASE_CLIENT_EMAIL   : Firebase Admin SDKのサービスアカウントメール
 *   FIREBASE_PRIVATE_KEY    : Firebase Admin SDKの秘密鍵（\nをそのまま含む文字列）
 *
 * 【エンドポイント】
 *   POST /api/notification/send
 *   Body: { userId: string, title: string, body: string, data?: Record<string, string> }
 *   ※ SUPABASE_SERVICE_ROLE_KEY をAuthorizationヘッダーに付けること（サーバー間通信のみ）
 *
 *   PUT /api/notification/send
 *   Body: { type: 'auto' }
 *   → pg_cronから毎時呼び出す。JST時刻でmorning_time/evening_timeと照合し
 *     一致ユーザーにキャラ口調のメッセージを送信する。
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { pickMessage, CHARACTER_NAMES, DEFAULT_CHARACTER } from '@/lib/notificationMessages'
import type { NotificationSlot } from '@/lib/notificationMessages'

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
              aps: { sound: 'default', badge: 1 },
            },
          },
          android: {
            notification: { sound: 'default' },
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

// ── 認証ヘルパー ──────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
}

// ── Firebase 環境変数チェック ─────────────────────────────────────
function checkFirebaseEnv(): string | null {
  if (!process.env.FIREBASE_PROJECT_ID)   return 'FIREBASE_PROJECT_ID が未設定です'
  if (!process.env.FIREBASE_CLIENT_EMAIL) return 'FIREBASE_CLIENT_EMAIL が未設定です'
  if (!process.env.FIREBASE_PRIVATE_KEY)  return 'FIREBASE_PRIVATE_KEY が未設定です'
  return null
}

// ── POST: 特定ユーザーへの単発送信 ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envError = checkFirebaseEnv()
    if (envError) {
      return NextResponse.json({ error: envError }, { status: 503 })
    }

    const { userId, title, body, data } = await req.json()
    if (!userId || !title || !body) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('push_token')
      .eq('user_id', userId)
      .single()

    if (!profile?.push_token) {
      return NextResponse.json({ skipped: true, reason: 'push_tokenが未設定' })
    }

    await sendFcmNotification({ token: profile.push_token, title, body, data })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Push notification error:', error)
    return NextResponse.json({ error: error.message ?? '送信に失敗しました' }, { status: 500 })
  }
}

// ── PUT: pg_cronからの定時一括送信 ───────────────────────────────
//
// Supabase SQL Editor で以下を実行してスケジュールを登録する:
//
//   SELECT cron.schedule(
//     'fuu-notification',
//     '0 * * * *',
//     $$
//       SELECT net.http_put(
//         url     := 'https://fuu-app.vercel.app/api/notification/send',
//         headers := jsonb_build_object(
//           'Content-Type',  'application/json',
//           'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
//         ),
//         body    := '{"type":"auto"}'::jsonb
//       );
//     $$
//   );
//
// ※ pg_net 拡張が必要（Supabase Dashboard → Database → Extensions で有効化）
// ※ 毎時0分に実行。profiles.morning_time / evening_time と照合して送信先を絞る。
// ──────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envError = checkFirebaseEnv()
    if (envError) {
      return NextResponse.json({ error: envError }, { status: 503 })
    }

    // JST 現在時刻（"HH:" 形式で比較）
    const now = new Date()
    const jstHour    = String((now.getUTCHours() + 9) % 24).padStart(2, '0')
    const jstHourKey = `${jstHour}:`  // "07:" のように時間部分だけ比較

    const admin = createAdminClient()

    // push_token があり通知有効なユーザーを全取得
    const { data: profiles } = await admin
      .from('profiles')
      .select('user_id, push_token, morning_time, evening_time, notification_character')
      .not('push_token', 'is', null)
      .eq('notification_enabled', true)

    if (!profiles?.length) {
      return NextResponse.json({ success: true, sent: 0, reason: '対象ユーザーなし' })
    }

    let sent = 0
    const errors: string[] = []

    await Promise.allSettled(
      profiles
        .filter(p => p.push_token)
        .map(async p => {
          // 設定時刻の時間部分だけ現在時刻と照合
          const mTime = (p.morning_time ?? '07:00').substring(0, 3)
          const eTime = (p.evening_time ?? '21:00').substring(0, 3)

          let slot: NotificationSlot | null = null
          if (jstHourKey === mTime) slot = 'morning'
          else if (jstHourKey === eTime) slot = 'evening'
          if (!slot) return

          const characterId = p.notification_character ?? DEFAULT_CHARACTER
          const title = CHARACTER_NAMES[characterId] ?? 'ふぅより'
          const body  = pickMessage(characterId, slot)

          try {
            await sendFcmNotification({ token: p.push_token!, title, body })
            sent++
          } catch (err: any) {
            errors.push(`${p.user_id}: ${err.message}`)
          }
        })
    )

    return NextResponse.json({ success: true, sent, errors: errors.slice(0, 10), jstHour })
  } catch (error: any) {
    console.error('Bulk push notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
