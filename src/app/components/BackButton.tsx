'use client'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label?: string
  title?: string
  fallback?: string
}

/** ブラウザ履歴を1つ戻るボタン。title を渡すと「‹ タイトル」ごとタップ領域になる。 */
export default function BackButton({ label = '‹', title, fallback = '/' }: BackButtonProps) {
  const router = useRouter()
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }
  return (
    <button
      onClick={handleBack}
      style={{
        display: 'flex', alignItems: 'center', gap: title ? 6 : 0,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '6px 0', fontFamily: 'inherit', lineHeight: 1,
      }}
    >
      <span style={{ color: '#E91E63', fontSize: 20, lineHeight: 1 }}>{label}</span>
      {title && (
        <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>{title}</span>
      )}
    </button>
  )
}
