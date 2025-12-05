import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const PermissionGate = ({ children, requiredRole, workspaceId, fallback = null }) => {
  const { hasPermission, loading } = usePermissions(workspaceId);

  if (loading) return null;
  
  if (!hasPermission(requiredRole)) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;
