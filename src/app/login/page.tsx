import { Suspense } from 'react'
import OtpForm from './OtpForm'

// Capacitorビルド対応：force-dynamic を削除し静的エクスポート可能に
// useSearchParams は OtpForm 内で Suspense に包んで処理

export default function Page() {
  return (
    <Suspense fallback={<div style={{ background: '#fdf4f7', minHeight: '100dvh' }} />}>
      <OtpForm />
    </Suspense>
  )
}
