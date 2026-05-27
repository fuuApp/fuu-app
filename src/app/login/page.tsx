import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { next?: string; error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <LoginClient
      nextPath={searchParams.next ?? '/app'}
      authError={searchParams.error ?? ''}
    />
  )
}
