// SURFACE: dream.overlay.RootNotFound  (framework-mandated basename: not-found.tsx)
import RootStatusScreen from '@/components/overlays/dream.RootStatusScreen';

export default function NotFound() {
  return (
    <RootStatusScreen
      eyebrow="404"
      title="Page not found"
      message="This page doesn&apos;t exist or has been moved. Let&apos;s get you back to your space."
      actions={[
        { href: '/', label: 'Go Home', primary: true },
        { href: '/login', label: 'Sign In' },
      ]}
    />
  );
}
