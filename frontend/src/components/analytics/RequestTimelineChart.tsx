import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestTimeline } from '@/hooks/useRequestTimeline';
import { formatTimelineTimestamp, formatNumber } from '@/utils/calculations';
import type { TimelineDuration } from '@/types/analytics';

export const RequestTimelineChart = () => {
    const [duration, setDuration] = useState<TimelineDuration>('hour');
    const { data, isLoading, error, refetch } = useRequestTimeline({ duration });

    const chartData = data?.data.map((point) => ({
        time: formatTimelineTimestamp(point.timestamp),
        requests: point.count,
    })) || [];

    const tabs = [
        {
            title: 'Last Hour',
            value: 'hour',
            content: renderChart(),
        },
        {
            title: 'Last 24 Hours',
            value: 'day',
            content: renderChart(),
        },
    ];

    function renderChart() {
        if (isLoading) {
            return (
                <div className="grid min-w-full flex-1 items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
                    <ChartSkeleton />
                </div>
            );
        }

        if (error) {
            return (
                <div className="grid min-w-full flex-1 items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
                    <ChartError onRetry={() => refetch()} message={error.message} />
                </div>
            );
        }

        return (
            <div className="grid min-w-full flex-1 items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Request Timeline</h3>
                        <p className="text-muted-foreground text-sm">
                            {duration === 'hour' ? 'Past 60 minutes' : 'Past 24 hours'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-muted-foreground text-xs">Total Requests</p>
                            <p className="font-bold text-2xl">{formatNumber(data?.totalRequests || 0)}</p>
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
                </div>

                {/* Chart */}
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="time"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickLine={{ stroke: 'currentColor' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickLine={{ stroke: 'currentColor' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="requests"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                {chartData.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                            Peak: {formatNumber(Math.max(...chartData.map(d => d.requests)))} requests
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Handle tab change
    const handleTabChange = (tabValue: string) => {
        setDuration(tabValue as TimelineDuration);
    };

    // Intercept tab clicks to update duration
    const enhancedTabs = tabs.map((tab) => ({
        ...tab,
        content: (
            <div onClick={() => handleTabChange(tab.value)}>
                {tab.content}
            </div>
        ),
    }));

    return (
        <div className="w-full">
            <Tabs
                tabs={enhancedTabs}
                containerClassName="mb-4"
                activeTabClassName="bg-primary"
                tabClassName="text-sm font-medium"
                contentClassName="mt-4"
            />
        </div>
    );
};

// Loading skeleton
const ChartSkeleton = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-16 w-[100px]" />
            </div>
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
    );
};

// Error state
const ChartError = ({ onRetry, message }: { onRetry: () => void; message: string }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load Chart</h3>
            <p className="mb-4 text-muted-foreground text-sm">{message}</p>
            <Button onClick={onRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
            </Button>
        </div>
    );
};


