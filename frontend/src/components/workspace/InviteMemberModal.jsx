import { useState } from 'react';
import { X, Mail, UserPlus, Send } from 'lucide-react';
import { workspaceInvitationAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Can manage workspace and invite members' },
  { value: 'member', label: 'Member', description: 'Can create and manage content' },
  { value: 'viewer', label: 'Viewer', description: 'Can only view content' }
];

function InviteMemberModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  // Get workspace ID from either context or user data
  const getWorkspaceId = () => {
    // Try from context first
    if (currentWorkspace?._id) return currentWorkspace._id;
    if (currentWorkspace?.id) return currentWorkspace.id;
    
    // Fallback to user's currentWorkspace ID
    if (user?.currentWorkspace) return user.currentWorkspace;
    
    // Last resort: get first workspace from user's workspaces
    if (user?.workspaces?.[0]?.workspace) {
      const ws = user.workspaces[0].workspace;
      return ws._id || ws.id || ws;
    }
    
    return null;
  };

  // Get workspace name
  const getWorkspaceName = () => {
    if (currentWorkspace?.name) return currentWorkspace.name;
    if (user?.workspaces?.[0]?.workspace?.name) return user.workspaces[0].workspace.name;
    return 'Loading workspace...';
  };

  const workspaceId = getWorkspaceId();
  const workspaceName = getWorkspaceName();

  // Debug logging
  console.log('InviteMemberModal - currentWorkspace:', currentWorkspace);
  console.log('InviteMemberModal - user:', user);
  console.log('InviteMemberModal - workspaceId:', workspaceId);
  console.log('InviteMemberModal - workspaceName:', workspaceName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    console.log('Sending invitation with workspaceId:', workspaceId);
    
    if (!workspaceId) {
      console.error('No workspace ID found.');
      console.error('currentWorkspace:', currentWorkspace);
      console.error('user:', user);
      toast.error('No workspace found. Please refresh the page and try again.');
      return;
    }

    try {
      setLoading(true);
      await workspaceInvitationAPI.sendInvitation({
        workspaceId: workspaceId,
        email: email.trim(),
        role
      });
      
      toast.success(`Invitation sent to ${email}`);
      handleClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invite Member
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {workspaceName}
              </p>
              {/* Debug info */}
              {!workspaceId && (
                <p className="text-xs text-red-500">
                  No workspace ID found
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role *
            </label>
            <div className="space-y-2">
              {ROLES.map((roleOption) => (
                <label
                  key={roleOption.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    role === roleOption.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.value}
                    checked={role === roleOption.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                    disabled={loading}
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {roleOption.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {roleOption.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              An invitation email will be sent with a link to join your workspace. The invitation expires in 7 days.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberModal;
