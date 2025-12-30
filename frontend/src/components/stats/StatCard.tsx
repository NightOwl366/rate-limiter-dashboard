import { Activity, ShieldAlert, CheckCircle, Ban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

export interface StatCardData {
    id: string;
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    theme: {
        hue: number;
        saturation: number;
        lightness: number;
    };
}

interface StatCardProps {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
}

export const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
}: StatCardProps): ReactElement => {
    return (
        <div className="grid min-w-[200px] max-w-[280px] flex-1 grid-rows-[auto_auto_1fr] items-start gap-4 rounded-2xl border border-foreground/20 bg-background p-5 text-foreground">

            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{title}</h3>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
                <p className="font-bold text-3xl">{value.toLocaleString()}</p>
            </div>

            <div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {description}
                </p>
            </div>

        </div>
    );
};

/* eslint-disable react-refresh/only-export-components */
export const STAT_CARDS: Record<string, Omit<StatCardData, 'value'>> = {
    totalRequests: {
        id: 'total-requests',
        title: 'Total Requests',
        description: 'All API requests received',
        icon: Activity,
        theme: {
            hue: 217,
            saturation: 91,
            lightness: 60,
        },
    },
    blockedRequests: {
        id: 'blocked-requests',
        title: 'Blocked Requests',
        description: 'Requests blocked by firewall or rate limiter',
        icon: ShieldAlert,
        theme: {
            hue: 0,
            saturation: 84,
            lightness: 60,
        },
    },
    allowedRequests: {
        id: 'allowed-requests',
        title: 'Allowed Requests',
        description: 'Successfully processed requests',
        icon: CheckCircle,
        theme: {
            hue: 142,
            saturation: 71,
            lightness: 45,
        },
    },
    bannedIPs: {
        id: 'banned-ips',
        title: 'Banned IPs',
        description: 'Currently banned IP addresses',
        icon: Ban,
        theme: {
            hue: 25,
            saturation: 95,
            lightness: 53,
        },
    },
};