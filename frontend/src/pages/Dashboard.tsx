import { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useOverviewStats } from '@/hooks/useOverviewStats';
import { StatsGrid } from '@/components/stats/StatsGrid';
import { StatsGridSkeleton } from '@/components/stats/StatsGridSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, LogOut, AlertCircle, BarChart3, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout, isAdmin } = useAuth();
    const { data, isLoading, error, refetch } = useOverviewStats();

    const handleLogout = () => {
        logout();
    };

    const handleRetry = async () => {
        toast.promise(refetch(), {
            loading: 'Refreshing stats...',
            success: 'Stats updated successfully',
            error: 'Failed to refresh stats',
        });
    };

    const getErrorMessage = (error: AxiosError<ApiResponse> | null): string => {
        if (!error) return 'Something went wrong';

        if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === 'object' && data !== null) {
                if (!data.success && 'error' in data) {
                    return data.error;
                }
            }
        }

        if (error.message) {
            return error.message;
        }

        return 'Something went wrong';
    };

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="container mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <p className="text-muted-foreground text-sm">
                                Welcome back, {user?.name}
                            </p>
                        </div>
                        <Badge
                            variant={isAdmin() ? 'default' : 'secondary'}
                            className="capitalize"
                        >
                            {user?.role}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/analytics">
                            <Button variant="ghost" size="sm">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Analytics
                            </Button>
                        </Link>
                        <Link to="/ips">
                            <Button variant="ghost" size="sm">
                                <Shield className="mr-2 h-4 w-4" />
                                IP Management
                            </Button>
                        </Link>

                        {!isLoading && !error && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRetry}
                                aria-label="Refresh stats"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <Separator />

            <main className="container mx-auto px-6 py-8">
                {isLoading && <StatsGridSkeleton />}

                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
                        <h2 className="mb-2 text-lg font-semibold">
                            Failed to Load Stats
                        </h2>
                        <p className="mb-4 text-muted-foreground text-sm">
                            {getErrorMessage(error)}
                        </p>
                        <Button onClick={handleRetry} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                )}

                {data && !isLoading && !error && <StatsGrid data={data.data} />}

                {data && !isLoading && !error && (
                    <div className="mt-8 rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Rate Limit Status</p>
                                <p className="text-muted-foreground text-xs">
                                    Current configuration: {data.data.currentRateLimit.points}{' '}
                                    requests per {data.data.currentRateLimit.duration} seconds
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    {data.rateLimit.remaining} / {data.rateLimit.limit} remaining
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;