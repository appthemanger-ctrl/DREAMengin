'use client'
/**
 * @deprecated v1-ui legacy surface — not used in active routes.
 * HomeDream is now implemented via components/home/HomeSystem.tsx
 * and components/dreamnav/. Do not import from here.
 * Scheduled for removal in Phase 3.
 */

import { useState, useRef, useEffect } from 'react'
import type { TouchEvent, MouseEvent } from 'react'
import { WidgetInstance, getWidgetType } from '@/types/widgets'
import { FileText, Image, Rss, User, Link } from 'lucide-react'

interface WidgetIconProps {
  widget: WidgetInstance
  isActive: boolean
  onLongPress: () => void
  onTap: () => void
  position: 'left' | 'right'
}

const LONG_PRESS_DURATION = 500 // ms

export default function WidgetIcon({
  widget,
  isActive,
  onLongPress,
  onTap,
  position,
}: WidgetIconProps) {
  const [isPressing, setIsPressing] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const type = getWidgetType(widget) || 'custom'

  const getWidgetIcon = () => {
    const iconProps = { className: 'w-6 h-6 text-white/80' }

    switch (type) {
      case 'text':
        return <FileText {...iconProps} />
      case 'media':
      case 'gallery':
      case 'album':
      case 'video':
      case 'music':
        return <Image {...iconProps} />
      case 'feed':
        return <Rss {...iconProps} />
      case 'profile_info':
      case 'profile':
        return <User {...iconProps} />
      case 'external_embed':
      case 'embed':
      case 'link_tree':
      case 'link':
        return <Link {...iconProps} />
      default:
        return <FileText {...iconProps} />
    }
  }

  const getWidgetColor = () => {
    switch (type) {
      case 'text':
        return 'from-blue-500 to-blue-600'
      case 'media':
      case 'gallery':
      case 'album':
      case 'video':
      case 'music':
        return 'from-purple-500 to-purple-600'
      case 'feed':
        return 'from-pink-500 to-pink-600'
      case 'profile_info':
      case 'profile':
        return 'from-emerald-500 to-emerald-600'
      case 'external_embed':
      case 'embed':
      case 'link_tree':
      case 'link':
        return 'from-orange-500 to-orange-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  const handlePressStart = (e: TouchEvent | MouseEvent) => {
    e.preventDefault()
    setIsPressing(true)
    startTimeRef.current = Date.now()

    pressTimer.current = setTimeout(() => {
      onLongPress()
      setIsPressing(false)
    }, LONG_PRESS_DURATION)
  }

  const handlePressEnd = (e: TouchEvent | MouseEvent) => {
    e.preventDefault()

    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }

    const pressDuration = Date.now() - startTimeRef.current

    if (pressDuration < LONG_PRESS_DURATION && isPressing) {
      onTap()
    }

    setIsPressing(false)
  }

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current)
    }
  }, [])

  return (
    <div
      className={`widget-icon relative transition-all duration-200 ${
        isActive ? 'scale-110' : 'scale-100'
      } ${isPressing ? 'scale-105' : ''}`}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={() => {
        if (pressTimer.current) {
          clearTimeout(pressTimer.current)
          pressTimer.current = null
        }
        setIsPressing(false)
      }}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div
        className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${getWidgetColor()} flex items-center justify-center transition-all duration-200 ${
          isActive
            ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent shadow-lg cosmic-glow'
            : 'shadow-md'
        }`}
      >
        {getWidgetIcon()}

        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-lg" />
        )}
      </div>

      {isPressing && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30"
            style={{
              animation: `fillProgress ${LONG_PRESS_DURATION}ms linear`,
            }}
          />
        </div>
      )}

      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <span className="text-[8px] text-white/80 font-bold">
          {type === 'feed' ? '∞' : String(type)[0]?.toUpperCase() || 'W'}
        </span>
      </div>
    </div>
  )
}
