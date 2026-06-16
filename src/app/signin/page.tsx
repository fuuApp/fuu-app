import { Suspense } from 'react'
import LoginClient from './LoginClient'

// Capacitorビルド対応：force-dynamic を削除し静的エクスポート可能に
export default function Page() {
  return (
    <Suspense fallback={<div style={{ background: '#fdf4f7', minHeight: '100dvh' }} />}>
      <LoginClient />
    </Suspense>
  )
}
