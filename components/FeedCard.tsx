export default function FeedCard({ item }: { item: any }){
  return (
    <article className="card p-4 mb-3">
      <div className="text-sm opacity-70">{new Date(item.ts || item.created_at || Date.now()).toLocaleString()}</div>
      <h3 className="text-lg font-semibold">{item.title || 'Untitled'}</h3>
      {item.summary && <p className="opacity-80">{item.summary}</p>}
      {item.url && <a className="link text-sm" href={item.url} target="_blank" rel="noreferrer">Open link</a>}
    </article>
  );
}
