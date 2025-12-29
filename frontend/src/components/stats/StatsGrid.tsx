import type { ReactElement } from 'react';
import GlowHover from '@/components/smoothui/glow-hover-card/index';
import type { GlowHoverItem } from '@/components/smoothui/glow-hover-card/index';
import { StatCard, STAT_CARDS } from './StatCard';
import type { StatsOverview } from '@/types/stats';

interface StatsGridProps {
    data: StatsOverview;
}

export const StatsGrid = ({ data }: StatsGridProps): ReactElement => {
  const items: GlowHoverItem[] = [
    {
      id: STAT_CARDS.totalRequests.id,
      theme: STAT_CARDS.totalRequests.theme,
      element: (
        <StatCard
          title={STAT_CARDS.totalRequests.title}
          value={data.totalRequests}
          description={STAT_CARDS.totalRequests.description}
          icon={STAT_CARDS.totalRequests.icon}
        />
      ),
    },
    {
      id: STAT_CARDS.blockedRequests.id,
      theme: STAT_CARDS.blockedRequests.theme,
      element: (
        <StatCard
          title={STAT_CARDS.blockedRequests.title}
          value={data.blockedRequests}
          description={STAT_CARDS.blockedRequests.description}
          icon={STAT_CARDS.blockedRequests.icon}
        />
      ),
    },
    {
      id: STAT_CARDS.allowedRequests.id,
      theme: STAT_CARDS.allowedRequests.theme,
      element: (
        <StatCard
          title={STAT_CARDS.allowedRequests.title}
          value={data.allowedRequests}
          description={STAT_CARDS.allowedRequests.description}
          icon={STAT_CARDS.allowedRequests.icon}
        />
      ),
    },
    {
      id: STAT_CARDS.bannedIPs.id,
      theme: STAT_CARDS.bannedIPs.theme,
      element: (
        <StatCard
          title={STAT_CARDS.bannedIPs.title}
          value={data.bannedIPs}
          description={STAT_CARDS.bannedIPs.description}
          icon={STAT_CARDS.bannedIPs.icon}
        />
      ),
    },
  ];

  return (
    <GlowHover
      items={items}
      className="flex flex-wrap gap-6 md:gap-8 lg:gap-10"
      maskSize={400}
      glowIntensity={0.15}
    />
  );
};