'use client';

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InnerDreamsButtonProps {
  isAdmin: boolean;
}

export default function IDariButton({ isAdmin }: InnerDreamsButtonProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/admin')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40 group"
      aria-label="Open iDari Admin Panel"
      title="iDari - Admin Panel"
    >
      <Sparkles className="w-5 h-5" />
      {isHovered && (
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap">
          iDari Admin
        </span>
      )}
    </button>
  );
}
