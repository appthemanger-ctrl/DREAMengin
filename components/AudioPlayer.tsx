'use client';
export default function AudioPlayer({ src }: { src?: string }){
  if(!src) return <div className="text-sm opacity-60">No audio</div>;
  return <audio className="w-full" controls src={src}/>;
}
