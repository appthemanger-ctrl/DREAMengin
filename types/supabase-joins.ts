import type { Database } from './supabase'

export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type ProfileRow = TableRow<'profiles'>

export type ProfileLite = Pick<
  ProfileRow,
  'id' | 'handle' | 'display_name' | 'avatar_url'
>

// ---- Common join result shapes (Supabase PostgREST) ----

// follows -> profiles join aliases
export type FollowWithFollowerProfile = { follower: ProfileLite | null }
export type FollowWithFollowingProfile = { following: ProfileLite | null }

// messages -> sender profile join alias
export type MessageRow = TableRow<'messages'>
export type MessageWithSender = MessageRow & { sender: ProfileLite | null }

// conversations join (participants + last message)
export type ConversationRow = TableRow<'conversations'>
export type ConversationWithParticipants = ConversationRow & {
  participant1: ProfileLite | null
  participant2: ProfileLite | null
  // last_message is a nested select of messages(content, created_at)
  last_message: Pick<MessageRow, 'content' | 'created_at'>[] | null
}

// feed_items -> profiles join
export type FeedItemRow = TableRow<'feed_items'>
export type FeedItemWithProfile = FeedItemRow & {
  profiles: Pick<ProfileRow, 'display_name' | 'handle' | 'avatar_url'> | null
}

// widget_instances -> profiles join (profile widgets in feeds)
export type WidgetInstanceRow = TableRow<'widget_instances'>
export type WidgetInstanceWithProfile = WidgetInstanceRow & {
  profiles: Pick<ProfileRow, 'display_name' | 'handle' | 'avatar_url'> | null
}
