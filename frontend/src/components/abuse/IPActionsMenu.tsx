import { useState } from 'react';
import { Shield, ShieldCheck, Trash2, MoreVertical } from 'lucide-react';
import BasicDropdown from '@/components/smoothui/basic-dropdown';
import type{ DropdownItem } from '@/components/smoothui/basic-dropdown';
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

interface IPActionsMenuProps {
  ipInfo: IPInfo;
}

export const IPActionsMenu = ({ ipInfo }: IPActionsMenuProps) => {
  const { isAdmin } = useAuth();
  const { mutate: resetStats, isPending: isResetting } = useResetIPStats();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // dropdown items based on IP status and user role
  const getDropdownItems = (): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (!isAdmin()) return items; // Viewers can't perform actions

    if (ipInfo.isBlocked) {
      items.push({
        id: 'unban',
        label: 'Unban IP',
        icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
      });
    } else {
      items.push({
        id: 'ban',
        label: 'Ban IP',
        icon: <Shield className="h-4 w-4 text-destructive" />,
      });
    }

    // Reset stats option (always available for admins)
    items.push({
      id: 'reset',
      label: 'Reset Stats',
      icon: <Trash2 className="h-4 w-4 text-orange-600" />,
    });

    return items;
  };

  const handleActionSelect = (item: DropdownItem) => {
    setDropdownOpen(false);
    
    switch (item.id) {
      case 'ban':
        setBanDialogOpen(true);
        break;
      case 'unban':
        setUnbanDialogOpen(true);
        break;
      case 'reset':
        setResetDialogOpen(true);
        break;
    }
  };

  const handleResetStats = () => {
    resetStats(ipInfo.ip, {
      onSuccess: () => {
        setResetDialogOpen(false);
      },
    });
  };

  const items = getDropdownItems();

  // Don't show menu if user is not admin
  if (!isAdmin()) {
    return null;
  }

  // Don't show menu if no actions available
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <div className="relative inline-block">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="h-8 w-8"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {/* Dropdown Component */}
        {dropdownOpen && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <BasicDropdown
              label="Actions"
              items={items}
              onChange={handleActionSelect}
              className="absolute right-0 top-0 z-50"
            />
          </div>
        )}
      </div>

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