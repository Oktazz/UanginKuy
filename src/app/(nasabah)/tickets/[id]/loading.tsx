import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Back Button Skeleton */}
      <Skeleton className="h-5 w-24 rounded-lg" />

      {/* Main Container Card */}
      <div className="bg-surface rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gray-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl bg-white/50" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-white/50" />
                <Skeleton className="h-4 w-32 bg-white/50" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>

          {/* Breakdown / Information area */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Pickup Details */}
          <div className="rounded-2xl border border-gray-100 p-5 bg-gray-50 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="sm:col-span-2 space-y-2 pt-2">
                <Skeleton className="h-4 w-32" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
