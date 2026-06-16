/**
 * チャットページ（サーバーコンポーネントラッパー）
 *
 * - generateStaticParams: Capacitorビルド（静的エクスポート）時に
 *   全キャラのパスを事前生成するために必要
 * - 実際のUI は ChatClient.tsx（'use client'）に分離
 */
import ChatClient from './ChatClient'

// Capacitorビルド（output: 'export'）用：全キャラのIDを事前定義
export function generateStaticParams() {
  return [
    { characterId: 'aoi' },
    { characterId: 'sakura' },
    { characterId: 'rika' },
    { characterId: 'natsuko' },
    { characterId: 'kenji' },
    { characterId: 'hiroshi' },
  ]
}

export default function ChatPage() {
  return <ChatClient />
}
