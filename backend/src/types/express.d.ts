declare namespace Express {
  interface Request {
    clientIp?: string;
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}