import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function pollYouTube(userId: string, accessToken: string) {
  try {
    // Fetch user's subscriptions
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    // For each subscription, fetch recent videos
    for (const sub of data.items || []) {
      const channelId = sub.snippet.channelId
      await fetchChannelVideos(userId, accessToken, channelId)
    }

  } catch (error) {
    console.error('YouTube polling error:', error)
  }
}

async function fetchChannelVideos(userId: string, accessToken: string, channelId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    // Map to feed_items and insert
    for (const item of data.items || []) {
      const feedItem = {
        user_id: userId,
        source: 'youtube',
        source_account_id: channelId,
        external_id: item.id.videoId,
        ts: new Date(item.snippet.publishedAt).toISOString(),
        title: item.snippet.title,
        summary: item.snippet.description,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        media_json: {
          thumbnail: item.snippet.thumbnails?.medium?.url,
          channelTitle: item.snippet.channelTitle,
        },
        tags_json: [],
        dedupe_hash: `${userId}-youtube-${item.id.videoId}`,
        visibility: 'private',
      }

      // Insert with upsert to handle duplicates
      await supabase
        .from('feed_items')
        .upsert(feedItem, { onConflict: 'dedupe_hash', ignoreDuplicates: true })
    }

  } catch (error) {
    console.error('Fetch channel videos error:', error)
  }
}