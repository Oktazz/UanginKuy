import { Skeleton } from "@/components/ui/skeleton";

export default function CounterLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="space-y-1.5">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 sm:w-96 max-w-full" />
        </div>

        {/* Tab Switcher Skeleton */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100/70 p-1 self-start sm:self-auto">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </header>

      {/* Main Content Skeleton (Dropoff POS) */}
      <div className="space-y-6">
        {/* Section 1: Identifikasi & Profil Nasabah */}
        <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-5 w-60" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-13 flex-1 rounded-2xl" />
            <Skeleton className="h-13 w-full sm:w-28 rounded-2xl shrink-0" />
          </div>
        </section>

        {/* Section 2: Input Penimbangan Sampah */}
        <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-48" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <div className="md:col-span-3 flex items-end">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <div className="flex items-center gap-6 sm:gap-8">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-8" />
              </div>
            </div>
            <div className="divide-y divide-gray-100 px-4 py-3 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-36 sm:w-44" />
                  <div className="flex items-center gap-6 sm:gap-8">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Pilihan Pembayaran & Penyelesaian */}
        <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-64" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="pl-8 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="pl-8 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          </div>

          <Skeleton className="h-14 w-full rounded-2xl" />
        </section>
      </div>
    </div>
  );
}
