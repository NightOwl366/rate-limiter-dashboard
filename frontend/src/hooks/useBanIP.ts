import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { abuseAPI } from '@/api/abuse';
import type { BanIPRequest, BanIPResponse, TopIPsResponse, BanIPMutationContext } from '@/types/abuse';

export const useBanIP = (): UseMutationResult<BanIPResponse, AxiosError, BanIPRequest> => {
    const queryClient = useQueryClient();

    return useMutation<BanIPResponse, AxiosError, BanIPRequest, BanIPMutationContext>({
        mutationFn: abuseAPI.banIP,
        onMutate: async (request) => {
            await queryClient.cancelQueries({ queryKey: ['top-ips'] });

            const previousData = queryClient.getQueryData<TopIPsResponse>(['top-ips', 50]);

            if (previousData) {
                queryClient.setQueryData<TopIPsResponse>(['top-ips', 50], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        ips: old.ips.map((ip) =>
                            ip.ip === request.ip
                                ? {
                                    ...ip,
                                    isBlocked: true,
                                    blockReason: request.reason,
                                    blockedAt: new Date().toISOString(),
                                }
                                : ip
                        ),
                    };
                });
            }

            return { previousData };
        },

        onError: (error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['top-ips', 50], context.previousData);
            }

            const errorMessage = (error.response?.data as { error?: string })?.error || error.message || 'Failed to ban IP';
            toast.error(errorMessage);
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['top-ips'] });
            queryClient.invalidateQueries({ queryKey: ['stats-overview'] })
            toast.success(`IP ${data.ip} banned successfully`);
        },
    });
};



