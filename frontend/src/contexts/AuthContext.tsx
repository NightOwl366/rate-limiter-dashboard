import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { ReactNode } from "react";
import { storage } from '../utils/storage.js';

type AdminRole = 'admin' | 'viewer';

interface Admin {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    isActive: boolean;
    lastLogin: string | null;
}

interface AuthState {
    admin: Admin | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

type AuthAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'LOGIN_SUCCESS'; payload: { admin: Admin; token: string } }
    | { type: 'LOGOUT' }
    | { type: 'RESTORE_SESSION'; payload: { admin: Admin | null; token: string } }
    | { type: 'UPDATE_ADMIN'; payload: Partial<Admin> };

interface AuthContextValue extends AuthState {
    login: (payload: { token: string; admin: Admin }) => void;
    logout: () => void;
    updateAdmin: (updates: Partial<Admin>) => void;
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
                admin: action.payload.admin,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false
            };

        case 'LOGOUT':
            return {
                admin: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };

        case 'RESTORE_SESSION':
            return {
                ...state,
                admin: action.payload.admin,
                token: action.payload.token,
                isAuthenticated: !!action.payload.token,
                isLoading: false,
            };

        case 'UPDATE_ADMIN':
            if (!state.admin) return state;

            return {
                ...state,
                admin: { ...state.admin, ...action.payload },
            };

        default:
            return state;
    }
};

const initialState: AuthState = {
    admin: null,
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
        if (state.admin) {
            storage.setUser(state.admin)
        }
    }, [state.admin]);

    const logout = useCallback(() => {
        storage.clearAuth();
        dispatch({ type: 'LOGOUT' });
    }, []);

    useEffect(() => {
        const restoreSession = () => {
            const storedToken = storage.getToken();
            const storedAdmin = storage.getUser<Admin>();

            if (storedToken) {
                dispatch({
                    type: 'RESTORE_SESSION',
                    payload: {
                        token: storedToken,
                        admin: storedAdmin,
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
        }

        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [logout]);

    const login = useCallback(({ token, admin }: { token: string; admin: Admin }) => {
        storage.setToken(token);
        storage.setUser(admin);

        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, admin },
        });
    }, []);

    const updateAdmin = useCallback((updates: Partial<Admin>) => {
        dispatch({ type: 'UPDATE_ADMIN', payload: updates });
    }, []);

    const isAdmin = useCallback(() => {
        return state.admin?.role === 'admin';
    }, [state.admin]);

    const isViewer = useCallback(() => {
        return state.admin?.role === 'viewer';
    }, [state.admin]);

    const value: AuthContextValue = {
        ...state,
        login,
        logout,
        updateAdmin,
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