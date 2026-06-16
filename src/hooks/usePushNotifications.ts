'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

/**
 * プッシュ通知の登録フック
 * - Capacitor環境（iOS/Android）でのみ実行
 * - FCMトークンを取得してSupabaseのprofiles.push_tokenに保存
 * - 通知受信時のハンドラを設定
 *
 * 使用方法: ルートレイアウトまたはAppLayoutで <PushNotificationSetup /> としてマウント
 */
export function usePushNotifications() {
  useEffect(() => {
    // ブラウザ環境（Web）では実行しない
    if (typeof window === 'undefined') return

    const setup = async () => {
      try {
        // Capacitorがない場合（Web）は何もしない
        const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null }))
        if (!Capacitor || !Capacitor.isNativePlatform()) return

        const { PushNotifications } = await import('@capacitor/push-notifications')

        // 通知パーミッション確認
        const permStatus = await PushNotifications.checkPermissions()
        if (permStatus.receive === 'prompt') {
          const result = await PushNotifications.requestPermissions()
          if (result.receive !== 'granted') return
        }
        if (permStatus.receive !== 'granted') return

        // FCMトークン登録
        await PushNotifications.register()

        // トークン取得 → Supabaseに保存
        PushNotifications.addListener('registration', async (token) => {
          try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 既存トークンと同じ場合は更新しない
            const { data: profile } = await supabase
              .from('profiles')
              .select('push_token')
              .eq('user_id', user.id)
              .single()

            if (profile?.push_token !== token.value) {
              await supabase
                .from('profiles')
                .update({ push_token: token.value })
                .eq('user_id', user.id)
            }
          } catch (err) {
            console.error('Push token save error:', err)
          }
        })

        // 登録エラー
        PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err)
        })

        // フォアグラウンド通知受信
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification)
          // フォアグラウンド時はToastなどで表示してもよい
        })

        // 通知タップ（バックグラウンド/終了状態）
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push action:', action)
          // 必要であれば特定画面へのディープリンクをここで処理
        })
      } catch (err) {
        // Capacitorのimportに失敗した場合は無視（Web環境）
      }
    }

    setup()
  }, [])
}
