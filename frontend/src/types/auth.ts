export interface LoginResponseData {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'viewer';
    isActive: boolean;
    lastLogin: string | null;
  };
}

export interface RefreshResponseData {
  token: string;
}
