import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
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
    images: [
      {
        url: 'https://fuu-app.vercel.app/og-image.png',
        width: 348,
        height: 348,
        alt: 'fuu ふぅ — AIママ友アプリ',
      },
    ],
  },
  twitter: {
    card: 'summary',
    images: ['https://fuu-app.vercel.app/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E91E63',
  viewportFit: 'cover',  // Dynamic Island / ノッチ対応
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
