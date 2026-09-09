import { Skeleton } from "@/components/ui/skeleton";

export default function WarehouseLoading() {
  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Map Panel */}
      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-[50vh] w-full min-h-[320px]" />
      </section>

      {/* Info Strip */}
      <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-surface p-5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-96 max-w-full" />
        </div>
      </div>
    </div>
  );
}