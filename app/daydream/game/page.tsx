import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export const metadata = {
  title: 'GameEngin Session – DREAMengin',
  description: 'Compatibility handoff into the GameEngin full-screen game session.',
};

type GamePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GamePage({ searchParams }: GamePageProps) {
  await connection();
  const params = new URLSearchParams();
  const resolved = await searchParams;
  Object.entries(resolved).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
      return;
    }
    if (typeof value === 'string') {
      params.set(key, value);
    }
  });

  redirect(`/engines/games${params.size ? `?${params.toString()}` : ''}`);
}
