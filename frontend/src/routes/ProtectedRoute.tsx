import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Loader from '@/components/kokonutui/loader';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader
          title="Restoring your session"
          subtitle="Please wait while we load your dashboard"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};