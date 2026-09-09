import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </header>

      {/* Upload Form Card */}
      <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm lg:p-8 space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-72" />
      </section>

      {/* Documents Table Card */}
      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 lg:px-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="divide-y divide-gray-100 px-6 py-2 lg:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
