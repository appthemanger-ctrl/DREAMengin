'use client'
import Image from 'next/image'

export default function LogoHero() {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border border-de-sky/20 animate-pulse-ring" />
        <div className="absolute w-48 h-48 rounded-full border border-de-gold/15 animate-pulse-ring"
          style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Character layers */}
      <div className="relative w-56 h-72 animate-float">
        {/* Coat */}
        <Image src="/coat_transparent.png" alt="" fill
          className="object-contain drop-shadow-[0_0_32px_rgba(125,211,252,0.4)]" />
        {/* Head (slightly above center) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28">
          <Image src="/head_transparent.png" alt="" fill className="object-contain" />
        </div>
        {/* Arms */}
        <div className="absolute bottom-16 left-0 w-16 h-20">
          <Image src="/arm1_transparent.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-16 right-0 w-16 h-20">
          <Image src="/arm2_transparent.png" alt="" fill className="object-contain" />
        </div>
        {/* Shoes */}
        <div className="absolute bottom-0 left-4 w-16 h-12">
          <Image src="/shoe1_transparent.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-0 right-4 w-16 h-12">
          <Image src="/shoe2_transparent.png" alt="" fill className="object-contain" />
        </div>
      </div>

      {/* Logo wordmark below character */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="relative w-64 h-16"
          style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '0.3s' }}>
          <Image src="/logo_DREAM_transparent.png" alt="DREAM" fill className="object-contain" />
        </div>
        <div className="relative w-64 h-12">
          <Image src="/logo_ENGIN_transparent.png" alt="ENGIN" fill
            className="object-contain opacity-90" />
        </div>
      </div>
    </div>
  )
}
