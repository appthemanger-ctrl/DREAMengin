import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/env'

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

// Demo connector that generates sample feed items
export async function generateDemoFeedItems(userId: string) {
  const demoItems = [
    {
      source: 'demo',
      source_account_id: 'demo_account',
      external_id: `demo_${Date.now()}_1`,
      title: 'Welcome to DreamEngin!',
      summary: 'This is a demo feed item to show how the feed system works.',
      url: 'https://example.com/demo1',
      tags_json: ['welcome', 'demo'],
    },
    {
      source: 'demo',
      source_account_id: 'demo_account',
      external_id: `demo_${Date.now()}_2`,
      title: 'Getting Started Guide',
      summary: 'Learn how to customize your dashboard and connect external accounts.',
      url: 'https://example.com/demo2',
      tags_json: ['tutorial', 'guide'],
    },
    {
      source: 'demo',
      source_account_id: 'demo_account',
      external_id: `demo_${Date.now()}_3`,
      title: 'Explore the Lab',
      summary: 'Discover scientific projects and collaborate with researchers.',
      url: 'https://example.com/demo3',
      tags_json: ['lab', 'science'],
    },
  ]

  for (const item of demoItems) {
    const feedItem = {
      ...item,
      user_id: userId,
      ts: new Date().toISOString(),
      media_json: {},
      dedupe_hash: `${userId}-demo-${item.external_id}`,
      visibility: 'private',
    }

    await supabase
      .from('feed_items')
      .upsert(feedItem, { onConflict: 'dedupe_hash', ignoreDuplicates: true })
  }
}