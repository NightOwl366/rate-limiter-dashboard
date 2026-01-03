import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { abuseAPI } from '@/api/abuse';
import type { ResetIPStatsResponse, TopIPsResponse, BanIPMutationContext } from '@/types/abuse';

export const useResetIPStats = (): UseMutationResult<ResetIPStatsResponse, AxiosError, string> => {
    const queryClient = useQueryClient();

    return useMutation<ResetIPStatsResponse, AxiosError, string, BanIPMutationContext>({
        mutationFn: abuseAPI.resetIPStats,

        onMutate: async (ip) => {
            await queryClient.cancelQueries({ queryKey: ['top-ips'] });

            const previousData = queryClient.getQueryData<TopIPsResponse>(['top-ips', 50]);

            if (previousData) {
                queryClient.setQueryData<TopIPsResponse>(['top-ips', 50], (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        ips: old.ips.filter((item) => item.ip !== ip),
                        total: old.total - 1,
                    };
                });
            }

            return { previousData };
        },

        onError: (error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['top-ips', 50], context.previousData);
            }

            const errorMessage = (error.response?.data as { error?: string })?.error || error.message ||
                'Failed to reset IP stats';
            toast.error(errorMessage);
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['top-ips'] });
            queryClient.invalidateQueries({ queryKey: ['stats-overview'] });

            toast.success(`Stats reset for IP ${data.ip}`);
        },
    });
};