import { Skeleton } from "@/components/ui/skeleton";

export default function SchedulesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Tabs Space-between */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100/70 p-1 self-start sm:self-auto shrink-0">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
      </div>

      {/* Schedule Table Card */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="divide-y divide-gray-100 px-6 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}