// app/dreamengin/DreamenginClient.tsx
// Client wrapper for the Dreamengin experience.
// NOTE: We load DreamenginApp with next/dynamic + ssr:false inside a Client Component.
// This avoids the App Router restriction that disallows ssr:false in Server Components.

'use client'

import dynamic from 'next/dynamic'

const DreamenginApp = dynamic(() => import('@/components/dreamengin/DreamenginApp'), {
  ssr: false,
})

export default function DreamenginClient() {
  return <DreamenginApp />
}
