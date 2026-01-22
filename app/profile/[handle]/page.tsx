type Params = { handle: string };

export default function ProfilePage({ params }: { params: Params }) {
  const { handle } = params;
  return (
    <main style={{ padding: 24 }}>
      <h1 className="text-xl font-semibold">@{handle}</h1>
      <p>Profile page is live. (Feed and links coming soon.)</p>
    </main>
  );
}
