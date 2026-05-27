import OtpForm from '../OtpForm'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { next?: string; error?: string }
}

export default function Page({ searchParams }: Props) {
  return (
    <OtpForm
      nextPath={searchParams.next ?? '/app'}
      authError={searchParams.error ?? ''}
    />
  )
}
