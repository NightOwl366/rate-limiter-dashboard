import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { ReactNode } from "react";
import { storage } from '@/utils/storage.js';
import { toast } from 'sonner';

type AdminRole = 'admin' | 'viewer';

interface User {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
}
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

type AuthAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGOUT' }
    | { type: 'RESTORE_SESSION'; payload: { user: User | null; token: string } }
    | { type: 'UPDATE_USER'; payload: Partial<User> };

interface AuthContextValue extends AuthState {
    login: (payload: { token: string; user: User }) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAdmin: () => boolean;
    isViewer: () => boolean;
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false
            };

        case 'LOGOUT':
            return {
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };

        case 'RESTORE_SESSION':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: !!action.payload.token,
                isLoading: false,
            };

        case 'UPDATE_USER':
            if (!state.user) return state;

            return {
                ...state,
                user: { ...state.user, ...action.payload },
            };

        default:
            return state;
    }
};

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
};

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        if (state.user) {
            storage.setUser(state.user);
        }
    }, [state.user]);

    const logout = useCallback(() => {
        storage.clearAuth();
        dispatch({ type: 'LOGOUT' });
        toast.info('Logged out successfully', {
            description: 'You have been signed out of your account'
        });
    }, []);

    useEffect(() => {
        const restoreSession = () => {
            const storedToken = storage.getToken();
            const storedUser = storage.getUser<User>();

            if (storedToken) {
                dispatch({
                    type: 'RESTORE_SESSION',
                    payload: {
                        token: storedToken,
                        user: storedUser,
                    },
                });
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
            toast.error('Session expired', {
                description: 'Please log in again to continue'
            });
        }

        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [logout]);

    const login = useCallback(({ token, user }: { token: string; user: User }) => {
        storage.setToken(token);
        storage.setUser(user);

        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, user },
        });
    }, []);

    const updateUser = useCallback((updates: Partial<User>) => {
        dispatch({ type: 'UPDATE_USER', payload: updates });
    }, []);

    const isAdmin = useCallback(() => {
        return state.user?.role === 'admin';
    }, [state.user]);

    const isViewer = useCallback(() => {
        return state.user?.role === 'viewer';
    }, [state.user]);

    const value: AuthContextValue = {
        ...state,
        login,
        logout,
        updateUser,
        isAdmin,
        isViewer,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export type { User, AdminRole };