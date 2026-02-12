import dynamic from 'next/dynamic';

// We dynamically import DreamenginApp because it uses the "use client" directive
// and depends on browser APIs.  The dynamic import disables SSR for this route.
const DreamenginApp = dynamic(() => import('@components/dreamengin/DreamenginApp'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default function DreamenginPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <DreamenginApp />
    </div>
  );
}