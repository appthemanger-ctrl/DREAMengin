import Link from 'next/link';

export default function MissionPage() {
  return (
    <main
      className="min-h-screen px-6 py-16 md:px-10 lg:px-16"
      style={{ background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 42%, #0f2244 72%, #0a1628 100%)' }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div
          className="inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            borderColor: 'rgba(200,152,26,0.3)',
            background: 'rgba(200,152,26,0.1)',
            color: '#e8d090',
          }}
        >
          Mission Statement
        </div>

        <section
          className="rounded-[2rem] border p-6 md:p-10"
          style={{
            borderColor: 'rgba(140,170,220,0.18)',
            background: 'linear-gradient(180deg, rgba(7,14,28,0.78) 0%, rgba(12,24,41,0.92) 100%)',
            boxShadow: '0 24px 80px rgba(7,14,28,0.38)',
          }}
        >
          <h1
            className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: 'rgba(220,235,255,0.97)' }}
          >
            Build a social home that rewards you.
          </h1>

          <div
            className="mt-6 space-y-6 text-base leading-8 md:text-lg"
            style={{ color: 'rgba(188,210,242,0.84)' }}
          >
            <p>
              We believe social media should be about <em>you</em>—not the algorithm, not the crowd, not the lucky
              break. It should reward creativity over copying, individuality over noise, and ownership over endless
              scrolling.
            </p>
            <p>
              That&apos;s why we built DREAMengin: a platform where your work gets seen because it&apos;s <em>yours</em>.
              Where you own your space, your data, and your voice. Where discovery happens through genuine expression,
              not who shouts loudest or steals fastest.
            </p>
            <p>
              We started from nothing—homeless, without a degree, without a team—and built this OS with an iPhone and
              an AI we taught to understand what a human really wants. Now we&apos;re inviting creators, coders, and
              dreamers to join us in building something new: a social home that rewards <em>you</em>.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/join"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 10px 28px rgba(245,158,11,0.3)',
              }}
            >
              Become a Dreamer again
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-medium transition-colors duration-200"
              style={{
                borderColor: 'rgba(140,170,220,0.2)',
                color: 'rgba(200,220,255,0.86)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              Back to DREAMengin
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
