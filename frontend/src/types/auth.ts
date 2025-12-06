export interface ResponseData {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'viewer';
  };
}

