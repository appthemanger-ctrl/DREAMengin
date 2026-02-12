import DreamenginClient from './DreamenginClient'

export const dynamic = 'force-dynamic'

export default function DreamenginPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <DreamenginClient />
    </div>
  )
}
