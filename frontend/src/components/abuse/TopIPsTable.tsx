import { useState } from 'react';
import { RefreshCw, AlertCircle, Shield, TrendingUp } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopIPs } from '@/hooks/useTopIPs';
import { IPActionsMenu } from './IPActionsMenu';
import { formatNumber, calculateTimeRemaining } from '@/utils/calculations';

export const TopIPsTable = () => {
    const [limit] = useState(50);
    const { data, isLoading, error, refetch } = useTopIPs({ limit });

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (error) {
        return (
            <TableError
                onRetry={() => refetch()}
                message={error.response?.data?.error || error.message}
            />
        );
    }

    if (!data || data.ips.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Top Active IPs</h3>
                    <p className="text-sm text-muted-foreground">
                        Showing {data.total} most active IP addresses
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">Rank</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.ips.map((ipInfo, index) => (
                            <TableRow key={ipInfo.ip}>
                                {/* Rank */}
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {index < 3 && (
                                            <TrendingUp className="h-4 w-4 text-orange-500" />
                                        )}
                                        #{index + 1}
                                    </div>
                                </TableCell>

                                {/* IP Address */}
                                <TableCell>
                                    <div className="font-mono text-sm">{ipInfo.ip}</div>
                                    {ipInfo.blockReason && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {ipInfo.blockReason}
                                        </div>
                                    )}
                                </TableCell>

                                {/* Request Count */}
                                <TableCell className="text-right font-semibold">
                                    {formatNumber(ipInfo.requestCount)}
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    {ipInfo.isBlocked ? (
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="destructive" className="w-fit">
                                                <Shield className="mr-1 h-3 w-3" />
                                                Blocked
                                            </Badge>
                                            {ipInfo.expiresAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    Expires: {calculateTimeRemaining(ipInfo.expiresAt)}
                                                </span>
                                            )}
                                            {!ipInfo.expiresAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    Permanent
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </Badge>
                                    )}
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <IPActionsMenu ipInfo={ipInfo} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>
                        Total Requests:{' '}
                        <span className="font-medium text-foreground">
                            {formatNumber(
                                data.ips.reduce((sum, ip) => sum + ip.requestCount, 0)
                            )}
                        </span>
                    </span>
                    <span>
                        Blocked IPs:{' '}
                        <span className="font-medium text-destructive">
                            {data.ips.filter((ip) => ip.isBlocked).length}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

// Loading skeleton
const TableSkeleton = () => {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[250px]" />
                </div>
                <Skeleton className="h-9 w-9" />
            </div>
            <div className="rounded-lg border">
                <div className="p-4 space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-4 w-[140px]" />
                            <Skeleton className="h-4 w-20 ml-auto" />
                            <Skeleton className="h-6 w-[70px]" />
                            <Skeleton className="h-8 w-9" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Error state
const TableError = ({ onRetry, message }: { onRetry: () => void; message: string }) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load IP Data</h3>
            <p className="mb-4 text-sm text-muted-foreground">{message}</p>
            <Button onClick={onRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
            </Button>
        </div>
    );
};

// Empty state
const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center">
            <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No IP Data Available</h3>
            <p className="text-sm text-muted-foreground">
                No IP addresses have been tracked yet. Data will appear as requests come in.
            </p>
        </div>
    );
};
