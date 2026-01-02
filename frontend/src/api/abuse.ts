import { api } from './axiosConfig';
import type { ApiResponse } from '../types/api';
import type {
    TopIPsResponse,
    BanIPRequest,
    UnbanIPRequest,
    BanIPResponse,
    UnbanIPResponse,
    ResetIPStatsResponse,
} from '../types/abuse';

export const abuseAPI = {
    getTopIPs: async (limit: number = 50): Promise<TopIPsResponse> => {
        const response = await api.get<ApiResponse<TopIPsResponse>>(
            '/abuse/top-ips',
            { params: { limit } }
        );

        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        if (!response.data.data) {
            throw new Error('Failed to fetch top IPs')
        }

        return response.data.data;
    },

    banIP: async (request: BanIPRequest): Promise<BanIPResponse> => {
        const response = await api.post<ApiResponse<BanIPResponse>>(
            '/abuse/block-ip',
            request
        );

        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        if (!response.data.data) {
            throw new Error('Failed to ban IP')
        }

        return response.data.data;
    },

    unbanIP: async (request: UnbanIPRequest): Promise<UnbanIPResponse> => {
        const response = await api.post<ApiResponse<UnbanIPResponse>>(
            '/abuse/unblock-ip',
            request
        );

        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        if (!response.data.data) {
            throw new Error('Failed to unban IP')
        }

        return response.data.data;
    },

    resetIPStats: async (ip: string): Promise<ResetIPStatsResponse> => {
        const response = await api.delete<ApiResponse<ResetIPStatsResponse>>(
            `/abuse/ip-stats/${ip}`
        );

        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        if (!response.data.data) {
            throw new Error('Failed to reset IP stats')
        }

        return response.data.data;
    },
};