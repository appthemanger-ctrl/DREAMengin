'use client';

export function FeedCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="p-6">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shimmer" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2 shimmer" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 shimmer" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full shimmer" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 shimmer" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6 shimmer" />
        </div>

        {/* Image skeleton */}
        <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl mb-4 shimmer" />

        {/* Action buttons skeleton */}
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full w-24 shimmer" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full w-24 shimmer" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full w-10 shimmer" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .dark .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
}

export function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3 shimmer" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6 shimmer" />
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .dark .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
}
