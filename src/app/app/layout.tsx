'use client'

/**
 * /app/app/* 配下の共通レイアウト
 *
 * - usePushNotifications をここでマウントすることで、
 *   ログイン済みの全画面でFCMトークンの登録・更新が走る
 * - Web環境では Capacitor が存在しないため自動的に何もしない
 */

import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  usePushNotifications()
  return <>{children}</>
}
