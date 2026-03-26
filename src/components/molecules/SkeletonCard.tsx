import { Skeleton } from "@/components/atoms/Skeleton"
import { cn } from "@/lib/utils"

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2 pt-0.5 sm:space-y-3", className)}>
      <Skeleton className="aspect-[3/4] w-full rounded-[var(--radius-sm)]" />
      <Skeleton className="h-3.5 w-4/5 sm:h-4 sm:w-3/4" />
      <Skeleton className="h-2.5 w-1/2 sm:h-3" />
    </div>
  );
}
