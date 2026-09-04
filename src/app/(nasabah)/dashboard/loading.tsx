import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-7 w-32 sm:w-40" />
          <Skeleton className="h-4 w-24 sm:w-32" />
        </div>
      </header>

      {/* Grid Stat */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card Skeleton */}
        <section className="h-full overflow-hidden rounded-2xl bg-primary/5 p-6 shadow-sm border border-primary/10">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-24 rounded-2xl" />
            <Skeleton className="h-4 w-20" />
          </div>
        </section>

        {/* Impact Tracker Skeleton */}
        <section className="flex h-full items-center space-x-4 rounded-2xl bg-gray-50 border border-gray-100 p-6 shadow-sm">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </section>
      </div>

      {/* Banner Cek Sampah Skeleton */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Chart Section Skeleton */}
      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <Skeleton className="h-48 w-48 rounded-full shrink-0" />
          <div className="w-full space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/6" />
          </div>
        </div>
      </section>
    </div>
  );
}
