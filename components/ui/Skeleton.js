export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-line/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function DeckListSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-line border-y border-line">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
