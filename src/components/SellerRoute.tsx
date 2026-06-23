import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SellerRoute() {
  const { user } = useAuth();

  if (!user || user.role !== 'Seller') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}