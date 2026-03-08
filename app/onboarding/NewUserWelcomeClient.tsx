'use client';

import { useRouter } from 'next/navigation';
import NewUserWelcome from '@/components/onboarding/NewUserWelcome';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export default function NewUserWelcomeClient({ profile }: { profile: ProfileLike | null }) {
  const router = useRouter();

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    try {
      localStorage.setItem('dreamengin:onboarding:complete', 'true');
    } catch { /* noop */ }
    
    // Navigate to the main homedream
    router.push('/homedream');
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <NewUserWelcome profile={profile} onComplete={handleComplete} />
    </div>
  );
}
