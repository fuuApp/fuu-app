import { redirect } from 'next/navigation'

type Props = {
  searchParams: { next?: string; error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  const params = new URLSearchParams()
  if (searchParams.next) params.set('next', searchParams.next)
  if (searchParams.error) params.set('error', searchParams.error)
  const qs = params.toString()
  redirect(`/login/otp${qs ? '?' + qs : ''}`)
}
