'use client'

export default function AudioPlayer({ src }: { src: string }) {
  return (
    <audio controls src={src}>
      Your browser does not support audio.
    </audio>
  )
}
