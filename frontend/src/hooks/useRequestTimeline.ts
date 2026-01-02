import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { analyticsAPI } from '@/api/analytics';
import type { RequestTimelineResponse, TimelineDuration } from '@/types/analytics';

interface UseRequestTimelineOptions {
    duration?: TimelineDuration;
    enabled?: boolean;
    refetchInterval?: number;
}

export const useRequestTimeline = (
    options: UseRequestTimelineOptions = {}
): UseQueryResult<RequestTimelineResponse, AxiosError> => {
    const {
        duration = 'hour',
        enabled = true,
        refetchInterval = 10000,
    } = options;

    return useQuery<RequestTimelineResponse, AxiosError>({
        queryKey: ['request-timeline', duration],
        queryFn: () => analyticsAPI.getRequestTimeline(duration),
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        staleTime: 5000,
    });
};