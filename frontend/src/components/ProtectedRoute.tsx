import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: UserRole;
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Si el usuario está autenticado pero no tiene el rol correcto,
    // redirigir a su dashboard correspondiente
    const dashboardRoute = user?.role === 'supervisor'
      ? '/dashboard/supervisor'
      : '/dashboard/preventionist';
    return <Navigate to={dashboardRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
