import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { abuseAPI } from '@/api/abuse';
import type { TopIPsResponse } from '@/types/abuse';
import type { ApiError } from '@/types/api';

interface UseTopIPsOptions {
    limit?: number;
    enabled?: boolean;
    refetchInterval?: number;
}

export const useTopIPs = (
    options: UseTopIPsOptions = {}
): UseQueryResult<TopIPsResponse, AxiosError<ApiError>>  => {
    const {
        limit = 50,
        enabled = true,
        refetchInterval = 5000,
    } = options;

    return useQuery<TopIPsResponse, AxiosError<ApiError>>({
        queryKey: ['top-ips', limit],
        queryFn: () => abuseAPI.getTopIPs(limit),
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 3000,
    });
};