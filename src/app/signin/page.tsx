import LoginClient from './LoginClient'

type Props = {
  searchParams: { next?: string; error?: string }
}

export default function Page({ searchParams }: Props) {
  return (
    <LoginClient
      nextPath={searchParams.next ?? '/app'}
      authError={searchParams.error ?? ''}
    />
  )
}
