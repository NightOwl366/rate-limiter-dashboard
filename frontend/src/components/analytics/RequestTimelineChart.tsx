import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestTimeline } from '@/hooks/useRequestTimeline';
import { formatNumber, formatTimelineTimestamp } from '@/utils/calculations';
import type { TimelineDuration } from '@/types/analytics';

interface ChartDataPoint {
  time: string;
  requests: number;
}

const ChartSkeleton = () => (
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

const ChartError = ({ onRetry, message }: { onRetry: () => void; message: string }) => (
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

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="mb-2 text-lg font-semibold">No Data Available</h3>
    <p className="mb-4 text-muted-foreground text-sm">
      No requests have been recorded in the selected time period.
    </p>
    <Button onClick={onRefresh} variant="outline" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Refresh
    </Button>
  </div>
);

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: ChartDataPoint }>; label?: string }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const value = data.value;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{data.payload.time}</p>
      <p className="text-lg font-bold text-primary">
        {value.toLocaleString()} {value === 1 ? 'request' : 'requests'}
      </p>
    </div>
  );
};

export const RequestTimelineChart = () => {
  const [activeTab, setActiveTab] = useState<TimelineDuration>('hour');

  const { data, isLoading, error, refetch } = useRequestTimeline({
    duration: activeTab,
    refetchInterval: 10000,
  });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data?.data) return [];
    return data.data.map((point) => ({
      time: formatTimelineTimestamp(point.timestamp),
      requests: point.count,
    }));
  }, [data]);

  const maxRequests = useMemo(() =>
    Math.max(...chartData.map((d) => d.requests), 1),
    [chartData]
  );

  const renderChart = () => {
    if (isLoading) {
      return <ChartSkeleton />;
    }

    if (error) {
      return <ChartError onRetry={() => refetch()} message={error.message} />;
    }

    if (!data || chartData.length === 0) {
      return <EmptyState onRefresh={() => refetch()} />;
    }

    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Request Timeline</h3>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'hour' ? 'Past 60 minutes' : 'Past 24 hours'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Total Requests</p>
              <p className="font-bold text-2xl">{formatNumber(data.totalRequests)}</p>
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

        <div className="w-full" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                minTickGap={activeTab === 'hour' ? 30 : 60}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                domain={[0, Math.max(maxRequests * 1.1, 10)]}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#ffffff"
                strokeWidth={3}
                dot={{
                  fill: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 2,
                  r: 5
                }}
                activeDot={{
                  r: 7,
                  fill: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {chartData.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Peak: {formatNumber(maxRequests)} requests</span>
          </div>
        )}
      </>
    );
  };

  const tabs = [
    {
      title: 'Last Hour',
      value: 'hour',
      content: activeTab === 'hour' ? (
        <div className="grid min-w-full flex-1 items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
          {renderChart()}
        </div>
      ) : null,
    },
    {
      title: 'Last 24 Hours',
      value: 'day',
      content: activeTab === 'day' ? (
        <div className="grid min-w-full flex-1 items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5">
          {renderChart()}
        </div>
      ) : null,
    },
  ];

  return (
    <div className="w-full">
      <Tabs
        tabs={tabs}
        containerClassName="mb-4"
        activeTabClassName="bg-primary"
        tabClassName="text-sm font-medium"
        contentClassName="mt-4"
        onTabChange={(value: string) => {
          setActiveTab(value as TimelineDuration);
        }}
      />
    </div>
  );
};