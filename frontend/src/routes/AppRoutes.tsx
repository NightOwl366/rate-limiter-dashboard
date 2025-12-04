import { Routes, Route } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import Login from '@/pages/Login.jsx';


export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
};
