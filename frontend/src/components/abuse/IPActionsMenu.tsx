import { useState } from 'react';
import { Shield, ShieldCheck, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BanIPDialog } from './BanIPDialog';
import { UnbanConfirmDialog } from './UnbanConfirmDialog';
import { useResetIPStats } from '@/hooks/useResetIPStats';
import { useAuth } from '@/contexts/AuthContext';
import type { IPInfo } from '@/types/abuse';
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
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface IPActionsMenuProps {
  ipInfo: IPInfo;
}

export const IPActionsMenu = ({ ipInfo }: IPActionsMenuProps) => {
  const { isAdmin } = useAuth();
  const { mutate: resetStats, isPending: isResetting } = useResetIPStats();

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleResetStats = () => {
    resetStats(ipInfo.ip, {
      onSuccess: () => {
        setResetDialogOpen(false);
      },
    });
  };

  // Don't show menu if user is not admin
  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {ipInfo.isBlocked ? (
            <DropdownMenuItem
              onClick={() => setUnbanDialogOpen(true)}
              className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-accent"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Unban IP</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setBanDialogOpen(true)}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-accent"
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Ban IP</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setResetDialogOpen(true)}
            className="cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-accent"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Reset Stats</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban Dialog */}
      <BanIPDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        prefilledIP={ipInfo.ip}
      />

      {/* Unban Dialog */}
      <UnbanConfirmDialog
        open={unbanDialogOpen}
        onOpenChange={setUnbanDialogOpen}
        ip={ipInfo.ip}
      />

      {/* Reset Stats Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-600" />
              Reset IP Statistics
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset statistics for{' '}
              <strong className="text-foreground">{ipInfo.ip}</strong>? This will remove
              the IP from the ranking and reset its request count to zero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetStats();
              }}
              disabled={isResetting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Stats
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};