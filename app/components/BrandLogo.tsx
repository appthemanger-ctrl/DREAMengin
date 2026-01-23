'use client'
import Image from 'next/image'
import Link from 'next/link'

export default function BrandLogo({ size = 64 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3 no-underline">
      <Image
        src="/brand/dreamengin-logo.png"
        alt="DREAMengin"
        width={size}
        height={size}
        priority
      />
      <span className="font-brand text-2xl md:text-3xl tracking-tight brand-title leading-none">DREAMPAGE</span>
    </Link>
  )
}
