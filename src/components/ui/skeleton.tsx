import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
      {...props}
    />
  )
}

export function SkeletonText({ className, lines = 1 }: { className?: string, lines?: number }) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

