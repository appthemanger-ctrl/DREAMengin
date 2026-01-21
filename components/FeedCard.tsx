
'use client';
export default function FeedCard({ item }: { item:any }) {
  const save = async () => {
    await fetch('/api/feed/save', { method:'POST', body: JSON.stringify({ id: item.id }) });
    alert('Saved for 24h');
  };
  return (
    <article className="card p-4">
      <div className="text-xs text-gray-500">{item.source} • {new Date(item.ts).toLocaleString()}</div>
      <h3 className="mt-1 font-semibold text-gray-900">{item.title}</h3>
      {item.summary && <p className="text-sm text-gray-700 mt-1">{item.summary}</p>}
      {item.media_json?.thumb_url && <img src={item.media_json.thumb_url} className="mt-3 rounded-lg border" alt="" />}
      <div className="flex gap-3 mt-3">
        {item.url && <a className="link text-sm" href={item.url} target="_blank">Open</a>}
        <button className="text-xs underline" onClick={save}>Save 24h</button>
      </div>
    </article>
  );
}
