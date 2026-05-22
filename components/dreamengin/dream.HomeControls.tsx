// components/dreamengin/dream.HomeControls.tsx
// ONE gold button. Always has been. Always will be.
//   • Single tap → open dual menus

'use client';

import InfinityIcon from '@/components/ui/dream.InfinityIcon';

interface HomeControlsProps {
  onBothMenus: () => void;
}

const BTN = 48;

export default function HomeControls({ onBothMenus }: HomeControlsProps) {
  const handleTap = () => {
    onBothMenus();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 18,
          transform: 'translateX(-50%)',
          zIndex: 60,
        }}
      >
        <button
          type="button"
          aria-label="Dream Navigation"
          className="flex items-center justify-center select-none"
          style={{
            width: BTN,
            height: BTN,
            borderRadius: 9999,
            backgroundColor: 'rgba(200,152,26,0.88)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            border: '2px solid rgba(255,255,255,0.16)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            handleTap();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
          }}
        >
          <InfinityIcon size={18} variant="flat" colorScheme="dark" />
        </button>
      </div>
    </div>
  );
}
