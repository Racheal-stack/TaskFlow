import { useState, useEffect } from 'react';
import axios from 'axios';

export const usePermissions = (workspaceId) => {
  const [userRole, setUserRole] = useState('viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      fetchUserRole();
    }
  }, [workspaceId]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const workspace = response.data;
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      
      if (workspace.owner === userId) {
        setUserRole('owner');
      } else {
        const member = workspace.members?.find(m => m.user === userId);
        setUserRole(member?.role || 'viewer');
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (requiredRole) => {
    const hierarchy = { viewer: 1, member: 2, admin: 3, owner: 4 };
    return hierarchy[userRole] >= hierarchy[requiredRole];
  };

  return { userRole, hasPermission, loading };
};
