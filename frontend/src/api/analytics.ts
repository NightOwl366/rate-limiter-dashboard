import { api } from './axiosConfig';
import type { ApiResponse } from '../types/api';
import type { RequestTimelineResponse, TimelineDuration } from '../types/analytics';

export const analyticsAPI = {
    getRequestTimeline: async (duration: TimelineDuration = 'hour'): Promise<RequestTimelineResponse> => {
        const response = await api.get<ApiResponse<RequestTimelineResponse>>(
            '/stats/requests',
            { params: { duration } }
        );

        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        if (!response.data.data) {
            throw new Error('Failed to fetch timeline data')
        }

        return response.data.data;
    },
};