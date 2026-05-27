// Server Component — 'use client' は書かない
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { headers } from 'next/headers'
import LoginClient from './LoginClient'

export default function Page() {
  // headers() を呼ぶことで Next.js が必ず動的レンダリングする
  headers()
  return <LoginClient />
}
