import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { statsAPI } from '@/services/stats.js';
import type { StatsResponse } from '@/types/stats.js';

interface UseOverviewStatsOptions {
    enabled?: boolean;
    refetchInterval?: number;
}

export const useOverviewStats = (
    options: UseOverviewStatsOptions = {}
): UseQueryResult<StatsResponse, AxiosError> => {
    const { enabled = true, refetchInterval = 3000 } = options;

    return useQuery<StatsResponse, AxiosError>({
        queryKey: ['stats-overview'],
        queryFn: statsAPI.getOverview,
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        retry: (failureCount, error) => {
            if (error.response?.status === 401) return false;   //auth errors
            if (error.response?.status === 403) return false;  //firewall blocks

            //server errors (503, 500)
            if (error.response?.status && error.response.status >= 500) {
                return failureCount < 3;
            }
            if (error.response?.status === 429) return false; //rate limit (429) - user is still authenticated ,interval handle it
            return false;
        },
        retryDelay: (attemptIndex) => {
            return Math.min(1000 * 2 ** attemptIndex, 10000);
        },
    });
};

