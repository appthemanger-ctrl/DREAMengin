export default function FeedCard({ item }: { item: any }) {
  return (
    <article className="card p-4 space-y-1">
      <div className="text-sm opacity-70">{new Date(item.ts ?? item.created_at ?? Date.now()).toLocaleString()}</div>
      <h3 className="text-lg font-semibold">{item.title ?? 'Untitled'}</h3>
      {item.summary && <p className="text-sm opacity-80">{item.summary}</p>}
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="link text-sm">Open link</a>
      )}
    </article>
  );
}
