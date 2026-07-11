'use client'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label?: string
  fallback?: string
}

/** ブラウザ履歴を1つ戻るボタン。履歴がない場合は fallback に遷移。 */
export default function BackButton({ label = '‹', fallback = '/' }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
      style={{
        color: '#E91E63', fontSize: 20, background: 'none',
        border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}
