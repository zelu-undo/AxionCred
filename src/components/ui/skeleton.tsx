import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200/60 dark:bg-gray-700/60 skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4 p-4 border-t"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={`line-${i}`} className="h-3 w-full" />
      ))}
    </div>
  )
}

function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export { Skeleton, TableSkeleton, CardSkeleton, StatsCardSkeleton, FormSkeleton }
