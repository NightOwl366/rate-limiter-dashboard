import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { useBanIP } from '@/hooks/useBanIP';
import type { BanIPRequest } from '@/types/abuse';
import ipaddr from 'ipaddr.js';

// Ban duration options (in seconds)
const BAN_DURATIONS = [
    { label: '1 Hour', value: '3600' },
    { label: '6 Hours', value: '21600' },
    { label: '1 Day', value: '86400' },
    { label: '7 Days', value: '604800' },
    { label: 'Permanent', value: '0' },
] as const;

const banIPSchema = z.object({
    ip: z
        .string()
        .refine(
            (value) => ipaddr.isValid(value),
            { message: 'Invalid IP address' }
        ),
    reason: z
        .string()
        .min(3, 'Reason must be at least 3 characters')
        .max(200, 'Reason must not exceed 200 characters'),
    duration: z.string()
});

type BanIPFormData = z.infer<typeof banIPSchema>;

interface BanIPDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prefilledIP?: string;
}

export const BanIPDialog = ({
    open,
    onOpenChange,
    prefilledIP,
}: BanIPDialogProps) => {
    const [ipInput, setIpInput] = useState(prefilledIP || '');
    const { mutate: BanIp, isPending } = useBanIP();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<BanIPFormData>({
        resolver: zodResolver(banIPSchema),
        defaultValues: {
            ip: prefilledIP || '',
            reason: '',
            duration: '3600',
        },
    });

    const selectedDuration = watch('duration');

    const getDurationLabel = (seconds: string) => {
        const duration = BAN_DURATIONS.find((d) => d.value === seconds);
        return duration?.label || '1 Hour';
    };

    const onSubmit = (data: BanIPFormData) => {
        const request: BanIPRequest = {
            ip: data.ip,
            reason: data.reason,
            duration: parseInt(data.duration, 10),
        };

        BanIp(request, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            }
        });
    };

    const handleIPSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValue('ip', ipInput);
    };

    const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIpInput(e.target.value);
        setValue('ip', e.target.value);
    };

    const handleClose = () => {
        if (!isPending) {
            reset();
            setIpInput('');
            onOpenChange(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-destructive" />
                        Ban IP Address
                    </DialogTitle>
                    <DialogDescription>
                        Block an IP address from accessing the API. Choose a duration or make it permanent.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* IP Address Input */}
                    <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <PlaceholdersAndVanishInput
                            placeholders={[
                                'Enter IP address...',
                                'e.g., 192.168.1.1',
                                'e.g., 10.0.0.5',
                            ]}
                            onChange={handleIPChange}
                            onSubmit={handleIPSubmit}
                        />
                        <input type="hidden" {...register('ip')} />
                        {errors.ip && (
                            <p className="text-sm text-destructive">{errors.ip.message}</p>
                        )}
                    </div>

                    {/* Reason Textarea */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="Why are you blocking this IP? (e.g., Excessive requests, Malicious activity)"
                            {...register('reason')}
                            disabled={isPending}
                            className="min-h-[100px]"
                        />
                        {errors.reason && (
                            <p className="text-sm text-destructive">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Duration Select */}
                    <div className="space-y-2">
                        <Label htmlFor="duration">Ban Duration</Label>
                        <Select
                            value={selectedDuration}
                            onValueChange={(value) => setValue('duration', value)}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>{getDurationLabel(selectedDuration)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {BAN_DURATIONS.map((duration) => (
                                    <SelectItem key={duration.value} value={duration.value}>
                                        {duration.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.duration && (
                            <p className="text-sm text-destructive">{errors.duration.message}</p>
                        )}
                    </div>

                    {/* Preview */}
                    {ipInput && selectedDuration && (
                        <div className="rounded-md border border-muted bg-muted/20 p-3">
                            <p className="text-sm text-muted-foreground">
                                {selectedDuration === '0' ? (
                                    <>
                                        <strong>{ipInput}</strong> will be <strong>permanently banned</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong>{ipInput}</strong> will be banned for{' '}
                                        <strong>{getDurationLabel(selectedDuration)}</strong>
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isPending || !ipInput}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Banning...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Ban IP
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};