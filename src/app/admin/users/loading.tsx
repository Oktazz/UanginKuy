import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.65fr)]">
        {/* Invite Form Card */}
        <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm space-y-5">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3 pt-1">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </section>

        {/* Staff Table Card */}
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="divide-y divide-gray-100 px-6 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}