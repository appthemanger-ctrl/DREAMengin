import { NextResponse } from 'next/server';

const HN_TOP_STORIES = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM = (id: number) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

export const revalidate = 300; // cache for 5 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 60);

  try {
    const idsRes = await fetch(HN_TOP_STORIES, { next: { revalidate: 300 } });
    if (!idsRes.ok) throw new Error('Failed to fetch story IDs');
    const ids: number[] = await idsRes.json();

    const stories = await Promise.all(
      ids.slice(0, limit).map(async (id) => {
        const res = await fetch(HN_ITEM(id), { next: { revalidate: 300 } });
        if (!res.ok) return null;
        return res.json();
      })
    );

    const filtered = stories.filter(
      (s) => s && s.type === 'story' && s.title
    );

    return NextResponse.json({ stories: filtered });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 502 }
    );
  }
}
