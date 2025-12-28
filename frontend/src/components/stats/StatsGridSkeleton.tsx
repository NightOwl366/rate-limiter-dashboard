import { StatCardSkeleton } from './StatCardSkeleton';

export const StatsGridSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-6 md:gap-8 lg:gap-10">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
};