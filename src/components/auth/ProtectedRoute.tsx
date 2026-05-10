import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: string | string[];
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const userRole = user?.role?.toLowerCase() || '';
    
    // Check if any of the allowed roles match the user's role
    const hasAccess = roles.some(r => {
      const target = r.toLowerCase();
      // Exact match or handle synonyms/partial matches
      return userRole === target || 
             (target === 'работник' && userRole.includes('работник')) ||
             (target === 'работник' && userRole.includes('персонал')) ||
             (target === 'администратор' && userRole.includes('администратор')) ||
             (target === 'администратор' && userRole.includes('admin')) ||
             (target === 'менеджер' && userRole.includes('менеджер'));
    });

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
