'use client';
export default function AudioPlayer({ src }: { src?: string }) {
  if (!src) return <div className="text-sm opacity-60 py-2">No preview available</div>;
  return (
    <div className="mt-3">
      <audio controls className="w-full accent-red-600">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
