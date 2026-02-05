import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Page not found.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The route you tried doesn’t exist (or it moved). The dream is big; the map is still evolving.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/discover"
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            Discover
          </Link>
        </div>
      </div>
    </div>
  )
}
