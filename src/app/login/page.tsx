// Server Component — 'use client' は書かない
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import LoginClient from './LoginClient'

export default function Page() {
  noStore() // キャッシュを完全に無効化
  return <LoginClient />
}
