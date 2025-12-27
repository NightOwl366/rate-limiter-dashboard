import type { AxiosResponse } from 'axios';
import { api } from '@/api/axiosConfig.js';
import type { ApiResponse } from '@/types/api.js';
import type { StatsOverview, StatsResponse, RateLimitHeaders } from '@/types/stats.js';

const extractRateLimitHeaders = (response: AxiosResponse): RateLimitHeaders => {
    const limit = parseInt(response.headers['x-ratelimit-limit'] || '0', 10);
    const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0', 10);
    const resetTimestamp = parseInt(response.headers['x-ratelimit-reset'] || '0', 10);

    return {
        limit,
        remaining,
        resetAt: new Date(resetTimestamp * 1000)
    };
};

export const statsAPI = {
    getOverview: async (): Promise<StatsResponse> => {
        const response = await api.get<ApiResponse<StatsOverview>>('/stats/overview');
        if (response.data.success == false ) {
            throw new Error(response.data.error || 'Failed to fetch stats');
        }

        if (!response.data.data) {
            throw new Error('No data returned from server')
        }

        return {
            data: response.data.data,
            rateLimit: extractRateLimitHeaders(response)
        };
    },
};