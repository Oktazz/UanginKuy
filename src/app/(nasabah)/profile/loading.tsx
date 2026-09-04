import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      {/* Identity Card */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
        <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full mt-2" />
        </div>
      </div>

      {/* Info Akun */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center px-4 py-4 space-x-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Pengaturan */}
      <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Skeleton className="h-4 w-24" />
        </div>
        
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex items-center px-4 py-4 space-x-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="w-4 h-4 rounded-sm" />
          </div>
        ))}
      </div>
      
      {/* Logout Button */}
      <Skeleton className="h-12 w-full rounded-2xl mt-8" />
    </div>
  );
}
