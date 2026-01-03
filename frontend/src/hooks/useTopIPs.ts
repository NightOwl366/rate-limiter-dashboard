import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { abuseAPI } from '@/api/abuse';
import type { TopIPsResponse } from '@/types/abuse';

interface UseTopIPsOptions {
    limit?: number;
    enabled?: boolean;
    refetchInterval?: number;
}

export const useTopIPs = (
    options: UseTopIPsOptions = {}
): UseQueryResult<TopIPsResponse, AxiosError> => {
    const {
        limit = 50,
        enabled = true,
        refetchInterval = 5000,
    } = options;

    return useQuery<TopIPsResponse, AxiosError>({
        queryKey: ['top-ips', limit],
        queryFn: () => abuseAPI.getTopIPs(limit),
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 3000,
    });
};