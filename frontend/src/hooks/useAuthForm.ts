import { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext.js';
import { api } from '@/api/axiosConfig.js';
import type { ApiResponse } from '@/types/api.js';
import type { ResponseData } from '@/types/auth.js';
import { toast } from 'sonner';

interface UseAuthFormReturn {
    error: string;
    loading: boolean;
    submitForm: (formData: Record<string, unknown>) => Promise<void>;
    clearError: () => void;
}

export const useAuthForm = (endpoint: string): UseAuthFormReturn => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submitForm = async (formData: Record<string, unknown>): Promise<void> => {
        setLoading(true);
        setError('');

        try {
            const { data } = await api.post<ApiResponse<ResponseData>>(
                endpoint,
                formData
            );

            if (!data.success || !data.data?.accessToken || !data.data?.user) {
                throw new Error('Invalid response format');
            }

            const { accessToken, user } = data.data;

            login({
                token: accessToken,
                user: user,
            });

            toast.success('Login successful!', {
                description: `Welcome back, ${user.name}!`
            });
            
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            toast.error('Login failed', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const clearError = (): void => setError('');

    return {
        error,
        loading,
        submitForm,
        clearError
    };
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        if (!error.response) {
            return 'Network error. Please check your connection.';
        }

        const serverMessage = error.response.data?.error || error.response.data?.message;
        if (serverMessage) return serverMessage;

        const status = error.response.status;

        if (status === 401) return 'Invalid credentials. Please try again.';
        if (status === 409) return 'An account with this email already exists.';
        if (status === 400) return 'Invalid input. Please check your information.';
        if (status === 403) return 'Access denied. Your account may be inactive.';
        if (status >= 500) return 'Server error. Please try again later.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
};