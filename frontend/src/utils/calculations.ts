/**
 * (allowed / total) * 100
 * Example: 
 * 8732 / 10456 = 0.835
   0.835 * 100 = 83.5
   83.5678 * 100 = 8356.78
   Math.round(8356.78) = 8357
   8357 / 100 = 83.57
 */

/**
 * Calculate success rate percentage , Backend gives raw counts, not percentages
 * @param allowed - Number of allowed requests
 * @param total - Total number of requests
 * @returns Success rate as percentage (0-100)
 */
export const calculateSuccessRate = (allowed: number, total: number): number => {
    if (total === 0) return 0;     //allowed / 0 === Infinity
    return Math.round((allowed / total) * 100 * 100) / 100; // Round to 2 decimals
};




/**
 * Calculate block rate percentage
 * @param blocked - Number of blocked requests
 * @param total - Total number of requests
 * @returns Block rate as percentage (0-100)
 */
export const calculateBlockRate = (blocked: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((blocked / total) * 100 * 100) / 100;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString();   //To 10456789 Formatted string (e.g., "10,456,789")
};




/**
 * Calculate time remaining until expiry
 * @param expiresAt - ISO timestamp string (e.g., 2026-01-03T18:43:12.232Z)
 * @returns Human-readable time remaining (e.g., "2h 30m")
 */
export const calculateTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();  //Output - Milliseconds remaining

    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;   //Only show hours if hours actually exist
    }

    return `${minutes}m`;
};




/**
 * Format timestamp for display
 * @param timestamp - Timestamp string from backend (format: "20250130-1430")
 * @returns Formatted time (e.g., "14:30")
 */
export const formatTimelineTimestamp = (timestamp: string): string => {
    // Extract hours and minutes from "20250130-1430"
    const hours = timestamp.substring(9, 11);
    const minutes = timestamp.substring(11, 13);
    return `${hours}:${minutes}`;
};
