import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { statsAPI } from '@/services/stats.js';
import type { StatsResponse } from '@/types/stats.js';
import type { ApiResponse } from '@/types/api'; 

interface UseOverviewStatsOptions {
    enabled?: boolean;
    refetchInterval?: number;
}

export const useOverviewStats = (
    options: UseOverviewStatsOptions = {}
): UseQueryResult<StatsResponse, AxiosError<ApiResponse>> => {
    const { enabled = true, refetchInterval =  10000 } = options;

    return useQuery<StatsResponse,AxiosError<ApiResponse>>({
        queryKey: ['stats-overview'],
        queryFn: statsAPI.getOverview,
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 5000,
        retry: (failureCount, error) => {
            if (error.response?.status === 401) return false;   //auth errors
            if (error.response?.status === 403) return false;  //firewall blocks

            //server errors (503, 500)
            if (error.response?.status && error.response.status >= 500) {
                return failureCount < 3;
            }
            if (error.response?.status === 429) return false; // Don't retry on rate limit (shouldn't happen for stats endpoint)
            return false;
        },
        retryDelay: (attemptIndex) => {
            return Math.min(1000 * 2 ** attemptIndex, 10000);
        },
    });
};

