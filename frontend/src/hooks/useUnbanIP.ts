import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { abuseAPI } from '@/api/abuse';
import type { UnbanIPRequest, UnbanIPResponse, TopIPsResponse, BanIPMutationContext } from '@/types/abuse';

export const useUnbanIP = (): UseMutationResult<UnbanIPResponse, AxiosError, UnbanIPRequest> => {
    const queryClient = useQueryClient();

    return useMutation<UnbanIPResponse, AxiosError, UnbanIPRequest, BanIPMutationContext>({
        mutationFn: abuseAPI.unbanIP,
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
                                    isBlocked: false,
                                    blockReason: undefined,
                                    blockedAt: undefined,
                                    expiresAt: undefined,
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

            const errorMessage = (error.response?.data as { error?: string })?.error || error.message || 'Failed to unban IP';
            toast.error(errorMessage);
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['top-ips'] });
            queryClient.invalidateQueries({ queryKey: ['stats-overview'] })

            toast.success(`IP ${data.ip} unbanned successfully`);
        }
    });
};