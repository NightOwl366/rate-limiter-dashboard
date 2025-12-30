import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton = () => {
  return (
    <div className="grid min-w-[200px] max-w-[280px] flex-1 grid-rows-[auto_auto_1fr] items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-5 w-5 rounded-md" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>

      <div>
        <Skeleton className="h-8 w-[100px]" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
};