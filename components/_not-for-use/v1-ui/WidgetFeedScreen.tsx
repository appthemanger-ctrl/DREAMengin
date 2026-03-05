'use client'

import { useState, useEffect } from 'react'
import { WidgetInstance } from '@/types/widgets'
import WidgetRail from './WidgetRail'
import FeedArea from './FeedArea'
import { createClient } from '@/lib/supabase/client'

interface WidgetFeedScreenProps {
  initialUserWidgets: WidgetInstance[]
  initialFollowingWidgets: WidgetInstance[]
  userId: string
}

export default function WidgetFeedScreen({
  initialUserWidgets,
  initialFollowingWidgets,
  userId,
}: WidgetFeedScreenProps) {
  const supabase = createClient()
  
  // State
  const [userWidgets, setUserWidgets] = useState<WidgetInstance[]>(initialUserWidgets)
  const [followingWidgets, setFollowingWidgets] = useState<WidgetInstance[]>(initialFollowingWidgets)
  const [activeFeedWidget, setActiveFeedWidget] = useState<WidgetInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize default active widget (feed widget)
  useEffect(() => {
    const defaultWidget = userWidgets.find(w => w.type === 'feed') || userWidgets[0]
    if (defaultWidget && !activeFeedWidget) {
      setActiveFeedWidget(defaultWidget)
    }
  }, [userWidgets, activeFeedWidget])

  // Refresh widgets periodically
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        // Refresh user widgets
        const { data: userWidgetsData } = await supabase
          .from('widget_instances')
          .select('*')
          .eq('user_id', userId)
          .eq('space', 'home')
          .order('order')

        if (userWidgetsData) {
          setUserWidgets(userWidgetsData)
        }

        // Refresh following widgets (from followed users' shared widgets)
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)

        if (followsData) {
          const followingIds = followsData.map(f => f.following_id)
          
          const { data: followingWidgetsData } = await supabase
            .from('widget_instances')
            .select(`
              *,
              profiles!inner(display_name, handle, avatar_url)
            `)
            .in('user_id', followingIds)
            .eq('space', 'profile')
            .in('visibility', ['public', 'followers'])
            .order('updated_at', { ascending: false })
            .limit(20)

          if (followingWidgetsData) {
            setFollowingWidgets(followingWidgetsData)
          }
        }
      } catch (err) {
        console.error('Error refreshing widgets:', err)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [userId, supabase])

  // Handle long press on widget icon (load widget)
  const handleLongPress = async (widget: WidgetInstance) => {
    if (!widget) return

    // Haptic feedback (if available)
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // Set as active widget
    setActiveFeedWidget(widget)
  }

  // Handle tap on widget icon (create post)
  const handleTap = (widget: WidgetInstance) => {
    if (!widget) return

    // Navigate to post creation
    // This will be handled by parent component or router
    window.dispatchEvent(
      new CustomEvent('createPost', {
        detail: { targetWidget: widget }
      })
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-universe">
        <div className="glass-dark border border-white/10 rounded-2xl p-6 max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="widget-feed-screen flex h-screen w-screen overflow-hidden bg-universe">
      {/* Left Rail: User's Widgets */}
      <WidgetRail
        position="left"
        widgets={userWidgets}
        activeWidgetId={activeFeedWidget?.id ?? null}
        onLongPress={handleLongPress}
        onTap={handleTap}
      />

      {/* Center: Feed Area */}
      <FeedArea
        activeWidget={activeFeedWidget}
        isLoading={isLoading}
      />

      {/* Right Rail: Following Widgets */}
      <WidgetRail
        position="right"
        widgets={followingWidgets}
        activeWidgetId={activeFeedWidget?.id ?? null}
        onLongPress={handleLongPress}
        onTap={handleTap}
      />
    </div>
  )
}
