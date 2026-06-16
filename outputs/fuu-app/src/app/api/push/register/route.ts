import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/push/register
 * プッシュ通知トークンを登録する
 *
 * Request: {
 *   token: string          // Expo Push Token (ExponentPushToken[...]) / FCM token
 *   notificationTime?: string  // 夜の通知時刻 "HH:MM" (デフォルト "21:00")
 *   morningTime?: string       // 朝の通知時刻 "HH:MM" (デフォルト "07:00")
 * }
 *
 * 使用シナリオ:
 * - ネイティブアプリ（React Native/Expo）が初回起動時に登録
 * - Web版ではService Worker + Web Push (VAPID) に変更予定
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { token, notificationTime, morningTime } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
    }

    // 時刻バリデーション (HH:MM形式)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    const updateData: Record<string, string> = { push_token: token }
    if (notificationTime && timeRegex.test(notificationTime)) {
      updateData.notification_time = notificationTime
    }
    if (morningTime && timeRegex.test(morningTime)) {
      updateData.morning_time = morningTime
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)

    if (error) {
      console.error('Push token registration error:', error)
      return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'プッシュ通知を登録しました' })
  } catch (error) {
    console.error('Push register error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

/**
 * DELETE /api/push/register
 * プッシュ通知を解除する
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    await supabase.from('profiles')
      .update({ push_token: null })
      .eq('id', session.user.id)

    return NextResponse.json({ ok: true, message: 'プッシュ通知を解除しました' })
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
