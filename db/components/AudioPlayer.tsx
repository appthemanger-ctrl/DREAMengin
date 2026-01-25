'use client';
export default function AudioPlayer({ src }: { src?: string }) {
  if (!src) return <div className="text-sm opacity-60 py-2">No preview available</div>;
  return (
    <div className="mt-3">
      <audio controls className="w-full">
        <source src={src} />
      </audio>
    </div>
  );
}
