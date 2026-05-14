import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Role, Permission } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermissions?: Permission[];
}

export default function ProtectedRoute({ children, allowedRoles, requiredPermissions }: ProtectedRouteProps) {
  const { state } = useAppContext();
  const user = state.currentUser;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <>{children}</>;
  }

  let hasAccess = false;

  const hasRoleAccess = allowedRoles ? allowedRoles.includes(user.role) : false;
  let hasPermissionAccess = false;

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    hasPermissionAccess = requiredPermissions.some(p => userPermissions.includes(p));
  }

  // If no restrictions are specified, allow any authenticated user
  const isPublicAuthenticatedRoute = !allowedRoles && (!requiredPermissions || requiredPermissions.length === 0);

  hasAccess = isPublicAuthenticatedRoute || hasRoleAccess || hasPermissionAccess;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-neon-pink/10 rounded-full flex items-center justify-center mb-4 border border-neon-pink/20">
          <span className="text-neon-pink text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-dark-text mb-2">Truy cập bị từ chối</h2>
        <p className="text-dark-muted">Bạn không có quyền truy cập vào trang này.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-dark-border text-dark-text rounded-md hover:bg-dark-border/80 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
