// Server Component — 'use client' は書かない
// force-dynamic を有効にするにはサーバーコンポーネントである必要がある
export const dynamic = 'force-dynamic'

import LoginClient from './LoginClient'

export default function Page() {
  return <LoginClient />
}
