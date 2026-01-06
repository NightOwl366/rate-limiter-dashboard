import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import Login from '@/pages/Login.jsx';
import Dashboard from '@/pages/Dashboard';
import { ProtectedRoute } from './ProtectedRoute';
import Analytics from '@/pages/Analytics';
import IPManagement from '@/pages/IPManagement';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics/>} />
        <Route path="/ips" element={<IPManagement />} />
      </Route>
    </Routes>
  );
};
