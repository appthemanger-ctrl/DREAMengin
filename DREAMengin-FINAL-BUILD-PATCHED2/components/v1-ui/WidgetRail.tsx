'use client'

import { useRef } from 'react'
import { WidgetInstance } from '@/types/widgets'
import WidgetIcon from './WidgetIcon'

interface WidgetRailProps {
  position: 'left' | 'right'
  widgets: WidgetInstance[]
  activeWidgetId?: string | null
  onLongPress: (widget: WidgetInstance) => void | Promise<void>
  onTap: (widget: WidgetInstance) => void
}

export default function WidgetRail({
  position,
  widgets,
  activeWidgetId = null,
  onLongPress,
  onTap,
}: WidgetRailProps) {
  const railRef = useRef<HTMLDivElement>(null)

  if (widgets.length === 0) {
    return (
      <div className={`widget-rail widget-rail-${position} flex flex-col items-center justify-center`}>
        <div className="text-center px-2">
          <p className="text-xs text-white/40">No widgets</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={railRef}
      className={`widget-rail widget-rail-${position} overflow-y-auto overflow-x-hidden scrollbar-hide`}
      style={{
        width: '80px',
        minWidth: '80px',
        height: '100vh',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}
    >
      <div className="flex flex-col items-center gap-3 px-3">
        {widgets.map((widget) => (
          <WidgetIcon
            key={widget.id}
            widget={widget}
            isActive={activeWidgetId != null && widget.id === activeWidgetId}
            onLongPress={() => onLongPress(widget)}
            onTap={() => onTap(widget)}
            position={position}
          />
        ))}
      </div>
    </div>
  )
}
