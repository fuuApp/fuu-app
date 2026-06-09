// fuu ふぅ Service Worker - 通知スケジューラー
// バージョン: 1.0

const CACHE_NAME = 'fuu-sw-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// メインスレッドからのメッセージを受信
self.addEventListener('message', (event) => {
  const { type, morningTime, eveningTime } = event.data || {}

  if (type === 'SCHEDULE_NOTIFICATIONS') {
    // 既存のタイマーをクリア
    if (self._morningTimer) clearTimeout(self._morningTimer)
    if (self._eveningTimer) clearTimeout(self._eveningTimer)

    if (morningTime) scheduleNotification(morningTime, 'morning')
    if (eveningTime) scheduleNotification(eveningTime, 'evening')
  }
})

function scheduleNotification(timeStr, period) {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)

  const next = new Date(now)
  next.setHours(h, m, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1) // 今日の時刻が過ぎていたら翌日

  const delay = next.getTime() - now.getTime()

  const timer = setTimeout(() => {
    const title = 'fuu ふぅ'
    const body = period === 'morning'
      ? 'おはよう！今日も話したいことがあったら来てね。'
      : 'お疲れさま。今日の気持ち、聞かせてね。'

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon_c.png',
      badge: '/icons/icon_c.png',
      tag: `fuu-${period}`,
      renotify: true,
      data: { url: '/app' },
    })

    // 翌日の同じ時間に再スケジュール
    scheduleNotification(timeStr, period)
  }, delay)

  if (period === 'morning') self._morningTimer = timer
  else self._eveningTimer = timer
}

// 通知クリック時にアプリを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/app'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
