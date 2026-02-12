import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

const DreamenginApp = dynamicImport(
  () => import('@/components/dreamengin/DreamenginApp'),
  { ssr: false }
)

export default function DreamenginPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <DreamenginApp />
    </div>
  )
}
