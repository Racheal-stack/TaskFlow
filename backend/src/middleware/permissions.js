const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { workspaceId, projectId } = req.params;
      const userId = req.user._id;

      const roleHierarchy = { viewer: 1, member: 2, admin: 3, owner: 4 };
      
      let userRole = 'viewer';
      
      if (workspaceId) {
        const workspace = await require('../models/Workspace').findById(workspaceId);
        const member = workspace.members.find(m => m.user.toString() === userId.toString());
        if (member) userRole = member.role;
        if (workspace.owner.toString() === userId.toString()) userRole = 'owner';
      }
      
      if (projectId) {
        const project = await require('../models/Project').findById(projectId);
        const member = project.members?.find(m => m.user.toString() === userId.toString());
        if (member && roleHierarchy[member.role] > roleHierarchy[userRole]) {
          userRole = member.role;
        }
      }

      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = { checkPermission };
