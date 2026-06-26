import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'fuu ふぅ — AIママ友アプリ',
  description: '育児中のママが、遠慮なく話せる場所。AIのママ友が、いつでもそばにいます。',
  keywords: ['育児', 'ワンオペ', 'ママ友', 'AI', 'アプリ', '共感'],
  openGraph: {
    title: 'fuu ふぅ — AIママ友アプリ',
    description: '育児中のママが、遠慮なく話せる場所。',
    type: 'website',
    locale: 'ja_JP',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E91E63',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
