import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 3000,
            gcTime: 5 * 60 * 1000,
            retry: (failureCount, error: unknown) => {
                if (error instanceof AxiosError && (error.response?.status === 401 || error.response?.status === 403)) {
                    return false;
                }
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => {
                return Math.min(1000 * 2 ** attemptIndex, 10000);
            },
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
        },
    },
});