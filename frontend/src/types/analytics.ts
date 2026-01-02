export interface TimelineDataPoint {
    timestamp: string; // Format: "20250130-1430"
    count: number;
}

export interface RequestTimelineResponse {
    data: TimelineDataPoint[];
    startTime: string;
    endTime: string;
    totalRequests: number;
}

export type TimelineDuration = 'hour' | 'day';