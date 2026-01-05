import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useUnbanIP } from '@/hooks/useUnbanIP';

interface UnbanConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ip: string;
}

export const UnbanConfirmDialog = ({
    open,
    onOpenChange,
    ip,
}: UnbanConfirmDialogProps) => {
    const { mutate: unbanIP, isPending } = useUnbanIP();

    const handleUnban = () => {
        unbanIP(
            { ip },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Unban IP Address
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to unban <strong className="text-foreground">{ip}</strong>?
                        This IP will immediately regain access to the API.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleUnban();
                        }}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unbanning...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Unban IP
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};