import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </header>

      {/* Tabs Skeleton */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl w-full sm:w-fit mb-6">
        <Skeleton className="h-10 w-32 rounded-xl mr-2" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row bg-surface rounded-2xl border border-gray-100 overflow-hidden h-48">
            {/* Left Part (Date) */}
            <div className="bg-gray-50/50 sm:w-1/3 p-6 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-gray-100">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 mt-4 rounded-lg" />
            </div>

            {/* Right Part (Details) */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
