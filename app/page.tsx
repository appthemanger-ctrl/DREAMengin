import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const DreamenginApp = dynamic(
  () => import('@/components/dreamengin/DreamenginApp'),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <DreamenginApp />
    </div>
  )
}
