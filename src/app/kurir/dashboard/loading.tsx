import { Skeleton } from "@/components/ui/skeleton";

export default function CourierDashboardLoading() {
  return (
    <div className="space-y-6 pb-8 max-w-lg mx-auto animate-in fade-in duration-500">
      <header className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </header>

      {/* Map Skeleton */}
      <section>
        <Skeleton className="w-full h-[45vh] rounded-3xl" />
      </section>

      {/* Route List Skeleton */}
      <section className="space-y-4 mt-8">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
