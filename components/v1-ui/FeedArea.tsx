'use client'

import { useEffect, useState } from 'react'
import { WidgetInstance, isFeedWidget, isTextWidget, isMediaWidget, getWidgetType } from '@/types/widgets'
import { Loader2 } from 'lucide-react'

interface FeedAreaProps {
  activeWidget: WidgetInstance | null
  isLoading?: boolean
}

export default function FeedArea({ activeWidget, isLoading }: FeedAreaProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayWidget, setDisplayWidget] = useState<WidgetInstance | null>(activeWidget)

  useEffect(() => {
    if (activeWidget?.id !== displayWidget?.id) {
      setIsTransitioning(true)

      const fadeOutTimer = setTimeout(() => {
        setDisplayWidget(activeWidget)
        setIsTransitioning(false)
      }, 150)

      return () => clearTimeout(fadeOutTimer)
    }
  }, [activeWidget, displayWidget])

  const renderWidgetContent = () => {
    if (!displayWidget) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-white/60">Select a widget to view</p>
            <p className="text-sm text-white/40 mt-2">Touch & hold an icon in the rails</p>
          </div>
        </div>
      )
    }

    if (isFeedWidget(displayWidget)) {
      return <FeedWidgetContent widget={displayWidget} />
    }

    if (isTextWidget(displayWidget)) {
      return <TextWidgetContent widget={displayWidget} />
    }

    if (isMediaWidget(displayWidget)) {
      return <MediaWidgetContent widget={displayWidget} />
    }

    const typeLabel = getWidgetType(displayWidget) || 'unknown'

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-white/80">Widget type: {typeLabel}</p>
          <p className="text-sm text-white/40 mt-2">Content preview coming soon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-area flex-1 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-universe/50 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div
        className={`h-full transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {renderWidgetContent()}
      </div>
    </div>
  )
}

function FeedWidgetContent({ widget }: { widget: WidgetInstance }) {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="glass-dark border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <select className="px-3 py-1.5 glass-dark border border-white/10 rounded-lg text-sm text-white">
              <option value="7d">Last 7 days</option>
              <option value="24h">Last 24 hours</option>
              <option value="30d">Last 30 days</option>
              <option value="mine">My posts only</option>
            </select>

            <select className="px-3 py-1.5 glass-dark border border-white/10 rounded-lg text-sm text-white">
              <option value="following">Following</option>
              <option value="me">Me</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="glass-dark/50 border border-white/10 rounded-lg p-4">
              <p className="text-white/80">Your feed appears here</p>
              <p className="text-sm text-white/40 mt-1">Posts from people you follow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextWidgetContent({ widget }: { widget: WidgetInstance }) {
  const config = (widget.config_json || widget.config || {}) as any

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="glass-dark border border-white/10 rounded-2xl p-6">
          {typeof config.title === 'string' && config.title.length > 0 && (
            <h2 className="text-2xl font-semibold text-white mb-4">{config.title}</h2>
          )}
          <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
            {(typeof config.text === 'string' && config.text) || 'No content'}
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaWidgetContent({ widget }: { widget: WidgetInstance }) {
  const config = (widget.config_json || widget.config || {}) as any

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="glass-dark border border-white/10 rounded-2xl p-6">
          {config.mediaType === 'image' ? (
            <img
              src={typeof config.mediaUrl === 'string' ? config.mediaUrl : ''}
              alt={typeof config.alt === 'string' ? config.alt : 'Media'}
              className="w-full h-auto rounded-xl"
            />
          ) : (
            <video
              src={typeof config.mediaUrl === 'string' ? config.mediaUrl : ''}
              controls
              className="w-full h-auto rounded-xl"
            />
          )}
          {typeof config.caption === 'string' && config.caption.length > 0 && (
            <p className="text-white/60 mt-4 text-center">{config.caption}</p>
          )}
        </div>
      </div>
    </div>
  )
}
