export interface StatsOverview {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  bannedIPs: number;
  currentRateLimit: {
    points: number;
    duration: number;
  };
}

export interface RateLimitHeaders {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface StatsResponse {
  data: StatsOverview;
  rateLimit: RateLimitHeaders;
}