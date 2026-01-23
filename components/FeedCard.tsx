export default function FeedCard({ item }: { item: any }) {
  return (
    <div className="card p-4 space-y-1">
      <div className="font-medium">{item?.title ?? 'Untitled'}</div>
      {item?.summary && <div className="text-sm opacity-80">{item.summary}</div>}
      {item?.url && <a className="text-sm underline" href={item.url} target="_blank">Open link</a>}
    </div>
  );
}
