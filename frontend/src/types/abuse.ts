export interface IPInfo {
    ip: string;
    requestCount: number;
    isBlocked: boolean;
    blockReason?: string;
    blockedAt?: string;
    expiresAt?: string;
}

export interface TopIPsResponse {
    ips: IPInfo[];
    total: number;
}

export interface BanIPRequest {
    ip: string;
    reason: string;
    duration?: number; // seconds, 0 = permanent
}

export interface UnbanIPRequest {
    ip: string;
}

export interface BanIPResponse {
    ip: string;
    requestCount: number;
    isBlocked: boolean;
    blockReason: string;
    blockedAt: string;
    expiresAt?: string;
}

export interface UnbanIPResponse {
    ip: string;
    requestCount: number;
    isBlocked: boolean;
}

export interface ResetIPStatsResponse {
    ip: string;
    removedFromRanking: boolean;
    removedCounter: boolean;
}

export type BanIPMutationContext = {
  previousData?: TopIPsResponse;
};