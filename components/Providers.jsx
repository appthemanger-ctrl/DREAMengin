'use client'
import { useEffect } from 'react'
import { Theme } from '@/lib/theme'

export default function Providers({ children }) {
  useEffect(()=>{ Theme.applyStored() }, [])
  return children
}
