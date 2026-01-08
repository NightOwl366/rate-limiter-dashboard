import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, Home , BarChart3 } from 'lucide-react';
import { TopIPsTable } from '@/components/abuse/TopIPsTable';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const IPManagement = () => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-muted/40">

      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                IP Management
              </h1>
              <p className="text-muted-foreground text-sm">
                Monitor and manage IP addresses
              </p>
            </div>
            <Badge variant={isAdmin() ? 'default' : 'secondary'} className="capitalize">
              {user?.role}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <Home  className="mr-0.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="ghost" size="sm">
                <BarChart3 className="mr-0.5 h-4 w-4" />
                Analytics
              </Button>
            </Link>

            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="container mx-auto px-6 py-8">
        {!isAdmin() && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Viewer Mode:</strong> You can view IP data but cannot perform ban/unban actions.
              Contact an administrator for elevated permissions.
            </p>
          </div>
        )}

        <TopIPsTable />
      </main>
    </div>
  );
};

export default IPManagement;