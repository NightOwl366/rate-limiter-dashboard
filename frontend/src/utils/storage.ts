type StorageValue = string | number | boolean | object | null;

interface StorageAPI {
    get<T = StorageValue>(key: string): T | null;
    set(key: string, value: StorageValue): void;
    remove(key: string): void;

    getToken(): string | null;
    setToken(token: string): void;
    removeToken(): void;

    getUser<T = unknown>(): T | null;
    setUser(user: object): void;
    removeUser(): void;

    clearAuth(): void;
}

const isJsonString = (str: string): boolean => {
    return (str.startsWith('{') && str.endsWith('}')) ||
        (str.startsWith('[') && str.endsWith(']'));
};

export const storage: StorageAPI = {
    get<T = StorageValue>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            if (isJsonString(item)) {
                return JSON.parse(item)
            };

            return item as T;
        } catch (error) {
            console.warn(`Failed to retrieve "${key}" from localStorage:`, error);
            return null;
        }
    },

    set(key: string, value: StorageValue): void {
        try {
            const serialized = typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : String(value);

            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error(`Failed to store "${key}" in localStorage:`, error);
        }
    },

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Failed to remove "${key}" from localStorage:`, error);
        }
    },

    getToken(): string | null {
        return storage.get<string>('token');
    },

    setToken(token: string): void {
        storage.set('token', token);
    },

    removeToken(): void {
        storage.remove('token');
    },

    getUser<T = unknown>(): T | null {
        return storage.get<T>('user');
    },

    setUser(user: object): void {
        storage.set('user', user);
    },

    removeUser(): void {
        storage.remove('user');
    },

    clearAuth(): void {
        storage.removeToken();
        storage.removeUser();
    },
};