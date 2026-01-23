export const name = 'Messages';
export const slug = 'messages';

export default function MessagesWidget() {
  return (
    <div className="space-y-2">
      <div className="text-sm opacity-80">Messages</div>
      <div className="card">No new messages.</div>
    </div>
  );
}
