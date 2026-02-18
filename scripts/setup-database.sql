-- DreamEngin Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  handle text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  website text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Follows table
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Posts table
create table if not exists public.app_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  visibility text default 'public' check (visibility in ('public', 'private', 'followers')),
  media_urls text[] default '{}',
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feed items table
create table if not exists public.feed_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  content jsonb default '{}',
  ts timestamptz default now()
);

-- Conversations table
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant1_id uuid references public.profiles(id) on delete cascade not null,
  participant2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Music releases table
create table if not exists public.music_releases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  embed_url text,
  cover_url text,
  genre text,
  visibility text default 'public' check (visibility in ('public', 'private')),
  plays_count int default 0,
  likes_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Merch/Shop table
create table if not exists public.merch (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price decimal(10,2) not null,
  stock int default 0,
  image_url text,
  category text,
  sold_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects/Lab table
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  visibility text default 'private' check (visibility in ('public', 'private')),
  template text,
  tags text[] default '{}',
  data jsonb default '{}',
  views_count int default 0,
  forks_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  message text,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

-- Widget instances table
create table if not exists public.widget_instances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  widget_type text not null,
  config jsonb default '{}',
  "order" int default 0,
  created_at timestamptz default now()
);

-- Feed rules table
create table if not exists public.feed_rules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  target text,
  value jsonb default '{}',
  created_at timestamptz default now()
);

-- Connectors tokens table
create table if not exists public.connectors_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  source text not null,
  token jsonb default '{}',
  revoked boolean default false,
  created_at timestamptz default now()
);

-- Ad slots table
create table if not exists public.ad_slots (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  placement text not null,
  active boolean default true,
  price_day decimal(10,2),
  price_week decimal(10,2),
  created_at timestamptz default now()
);

-- Ad listings table
create table if not exists public.ad_listings (
  id uuid default uuid_generate_v4() primary key,
  ad_slot_id uuid references public.ad_slots(id) on delete cascade not null,
  status text default 'available' check (status in ('available', 'sold', 'pending')),
  created_at timestamptz default now()
);

-- Ad orders table
create table if not exists public.ad_orders (
  id uuid default uuid_generate_v4() primary key,
  ad_listing_id uuid references public.ad_listings(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- Likes table (polymorphic - supports posts, music, projects)
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('post', 'music', 'project')),
  content_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, content_type, content_id)
);

-- Admin audit log table
create table if not exists public.admin_audit_log (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Row Level Security Policies

-- Profiles: Anyone can read, users can update their own
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Follows: Anyone can read, authenticated users can manage their own
alter table public.follows enable row level security;

create policy "Follows are viewable by everyone" on public.follows
  for select using (true);

create policy "Users can follow others" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);

-- Posts: Public posts visible to all, private to owner
alter table public.app_posts enable row level security;

create policy "Public posts are viewable by everyone" on public.app_posts
  for select using (visibility = 'public' or auth.uid() = user_id);

create policy "Users can create posts" on public.app_posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" on public.app_posts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own posts" on public.app_posts
  for delete using (auth.uid() = user_id);

-- Messages: Only conversation participants can access
alter table public.messages enable row level security;

create policy "Users can view their messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (c.participant1_id = auth.uid() or c.participant2_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Conversations: Only participants can access
alter table public.conversations enable row level security;

create policy "Users can view their conversations" on public.conversations
  for select using (participant1_id = auth.uid() or participant2_id = auth.uid());

create policy "Users can create conversations" on public.conversations
  for insert with check (participant1_id = auth.uid() or participant2_id = auth.uid());

-- Music: Public releases visible to all
alter table public.music_releases enable row level security;

create policy "Public music is viewable by everyone" on public.music_releases
  for select using (visibility = 'public' or auth.uid() = user_id);

create policy "Users can create music releases" on public.music_releases
  for insert with check (auth.uid() = user_id);

create policy "Users can update their music" on public.music_releases
  for update using (auth.uid() = user_id);

create policy "Users can delete their music" on public.music_releases
  for delete using (auth.uid() = user_id);

-- Merch: All items visible
alter table public.merch enable row level security;

create policy "Merch is viewable by everyone" on public.merch
  for select using (true);

create policy "Users can create merch" on public.merch
  for insert with check (auth.uid() = user_id);

create policy "Users can update their merch" on public.merch
  for update using (auth.uid() = user_id);

create policy "Users can delete their merch" on public.merch
  for delete using (auth.uid() = user_id);

-- Projects: Public visible to all
alter table public.projects enable row level security;

create policy "Public projects are viewable by everyone" on public.projects
  for select using (visibility = 'public' or auth.uid() = owner_id);

create policy "Users can create projects" on public.projects
  for insert with check (auth.uid() = owner_id);

create policy "Users can update their projects" on public.projects
  for update using (auth.uid() = owner_id);

create policy "Users can delete their projects" on public.projects
  for delete using (auth.uid() = owner_id);

-- Notifications: Users can only see their own
alter table public.notifications enable row level security;

create policy "Users can view their notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "System can create notifications" on public.notifications
  for insert with check (true);

create policy "Users can update their notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Feed items: Users can only see their own
alter table public.feed_items enable row level security;

create policy "Users can view their feed" on public.feed_items
  for select using (auth.uid() = user_id);

create policy "System can create feed items" on public.feed_items
  for insert with check (true);

-- Likes: Anyone can read, users manage their own
alter table public.likes enable row level security;

create policy "Likes are viewable by everyone" on public.likes
  for select using (true);

create policy "Users can like content" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike content" on public.likes
  for delete using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_posts_user_id on public.app_posts(user_id);
create index if not exists idx_posts_created_at on public.app_posts(created_at desc);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_music_user on public.music_releases(user_id);
create index if not exists idx_merch_user on public.merch(user_id);
create index if not exists idx_projects_owner on public.projects(owner_id);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    coalesce(
      lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
      'user'
    ) || substr(new.id::text, 1, 8),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
