import { useState, useEffect } from 'react'
import { Settings, User, Bell, Shield, Palette, Globe, HelpCircle, LogOut, ChevronRight, Moon, Sun, Monitor, Key, Mail, Send, CheckCircle, Users, Clock, Trash2, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWorkspace } from '../context/WorkspaceContext'
import { workspaceInvitationAPI } from '../services/api'
import toast from 'react-hot-toast'
import InviteMemberModal from '../components/workspace/InviteMemberModal'
const SettingsPage = () => {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [activeSection, setActiveSection] = useState('profile')
  const [theme, setTheme] = useState('system')
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    mobile: false,
    marketing: false
  })
  const [emailStatus, setEmailStatus] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(false)

  // Load workspace members and invitations
  useEffect(() => {
    if (activeSection === 'workspace' && currentWorkspace?._id) {
      loadWorkspaceData()
    }
  }, [activeSection, currentWorkspace])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      // Get pending invitations for this workspace
      if (currentWorkspace?._id) {
        const invitationsRes = await workspaceInvitationAPI.getByWorkspace(currentWorkspace._id)
        setPendingInvitations(invitationsRes.data || [])
      }
      
      // Get workspace members from user data
      const userWorkspace = user?.workspaces?.find(
        w => (w.workspace?._id || w.workspace?.id || w.workspace) === currentWorkspace?._id
      )
      
      if (userWorkspace) {
        // For now, show just the current user as we don't have full member list
        setWorkspaceMembers([
          {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email
            },
            role: userWorkspace.role,
            _id: user._id
          }
        ])
      }
    } catch (error) {
      console.error('Error loading workspace data:', error)
      // Don't show error toast for this, just log it
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId) => {
    try {
      await workspaceInvitationAPI.cancel(invitationId)
      toast.success('Invitation cancelled')
      loadWorkspaceData()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Failed to cancel invitation')
    }
  }

  const handleResendInvitation = async (invitationId) => {
    try {
      await workspaceInvitationAPI.resend(invitationId)
      toast.success('Invitation resent')
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast.error('Failed to resend invitation')
    }
  }
  const settingsSections = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Manage your personal information'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Configure notification preferences'
    },
    {
      id: 'security',
      label: 'Security & Privacy',
      icon: Shield,
      description: 'Password and security settings'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      description: 'Theme and display preferences'
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: Globe,
      description: 'Team and workspace settings'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      description: 'Get help and contact support'
    },
    {
      id: 'admin',
      label: 'Admin Tools',
      icon: Key,
      description: 'Administrative functions and email testing',
      adminOnly: true
    }
  ]
  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ]
  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
        {}
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">RC</span>
          </div>
          <div>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Change Photo
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">JPG, PNG or GIF. Max size 5MB</p>
          </div>
        </div>
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              defaultValue="Racheal"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              defaultValue="Chen"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              defaultValue="racheal.chen@taskflow.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
            <textarea
              rows={4}
              defaultValue="Product Manager passionate about creating amazing user experiences. I love collaborating with teams to build products that make a difference."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                  {key === 'marketing' ? 'Marketing Emails' : `${key} Notifications`}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'desktop' && 'Show desktop notifications'}
                  {key === 'mobile' && 'Push notifications on mobile'}
                  {key === 'marketing' && 'Product updates and marketing content'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
        <div className="space-y-6">
          {}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Update Password
              </button>
            </div>
          </div>
          {}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add an extra layer of security to your account</p>
              </div>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                theme === option.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <option.icon className={`w-5 h-5 ${
                  theme === option.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'
                }`} />
                <span className={`font-medium ${
                  theme === option.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  const renderWorkspaceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workspace Settings</h3>
        
        {/* Current Workspace Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Current Workspace</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{currentWorkspace?.name || 'Loading...'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {workspaceMembers.length} member{workspaceMembers.length !== 1 ? 's' : ''} · {user?.workspaces?.find(w => w.workspace._id === currentWorkspace?._id)?.role || 'Member'}
              </p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Members
            </button>
          </div>
        </div>

        {/* Workspace Members */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Workspace Members ({workspaceMembers.length})
            </h4>
          </div>
          
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading members...</p>
          ) : workspaceMembers.length > 0 ? (
            <div className="space-y-3">
              {workspaceMembers.map((member) => (
                <div key={member._id || member.user?._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {member.user?.name?.charAt(0)?.toUpperCase() || member.user?.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user?.name || member.user?.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'owner' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : member.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No members found</p>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Invitations ({pendingInvitations.length})
            </h4>
          </div>
          
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading invitations...</p>
          ) : pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitation.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invitation.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {invitation.role}
                    </span>
                    <button
                      onClick={() => handleResendInvitation(invitation._id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Resend invitation"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Cancel invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No pending invitations</p>
          )}
        </div>
      </div>
    </div>
  )
  const renderHelpSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Help & Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Documentation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Learn how to use TaskFlow effectively</p>
            <button className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
              View Docs
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get help from our support team</p>
            <button className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
              Contact Us
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Feature Requests</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Suggest new features for TaskFlow</p>
            <button className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
              Submit Idea
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Community</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Join our user community</p>
            <button className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
              Join Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  const renderAdminSection = () => {
    const handleGetEmailStatus = async () => {
      try {
        const response = await fetch('/api/auth/email-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setEmailStatus(data);
      } catch (error) {
        console.error('Failed to get email status:', error);
      }
    };
    const handleTestEmail = async () => {
      setIsTestingEmail(true);
      try {
        const response = await fetch('/api/auth/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ email: testEmail })
        });
        const data = await response.json();
        setEmailTestResult(data);
      } catch (error) {
        setEmailTestResult({
          success: false,
          message: 'Failed to send test email: ' + error.message
        });
      } finally {
        setIsTestingEmail(false);
      }
    };
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Service Administration</h3>
          {}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Email Service Status</h4>
              <button
                onClick={handleGetEmailStatus}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Check Status
              </button>
            </div>
            {emailStatus && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${emailStatus.status.initialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Service {emailStatus.status.initialized ? 'Initialized' : 'Not Initialized'}
                  </span>
                </div>
                {emailStatus.status.provider && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Provider: <span className="font-medium">{emailStatus.status.provider}</span>
                  </div>
                )}
                {emailStatus.status.lastError && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Last Error: {emailStatus.status.lastError}
                  </div>
                )}
              </div>
            )}
          </div>
          {}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Test Email Functionality</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to test"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleTestEmail}
                disabled={isTestingEmail || !testEmail}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isTestingEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </div>
            {emailTestResult && (
              <div className={`mt-4 p-4 rounded-lg ${emailTestResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                <div className="flex items-center space-x-2">
                  {emailTestResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  <span className="font-medium">{emailTestResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection()
      case 'notifications':
        return renderNotificationsSection()
      case 'security':
        return renderSecuritySection()
      case 'appearance':
        return renderAppearanceSection()
      case 'workspace':
        return renderWorkspaceSection()
      case 'help':
        return renderHelpSection()
      case 'admin':
        return renderAdminSection()
      default:
        return renderProfileSection()
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and workspace settings</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <nav className="space-y-1">
                {settingsSections.filter(section => !section.adminOnly || user?.role === 'admin').map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between px-3 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{section.label}</div>
                        <div className="text-xs opacity-75">{section.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </nav>
              {}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
          {}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => {
            setShowInviteModal(false)
            loadWorkspaceData() // Refresh data after invitation
          }}
        />
      )}
    </div>
  )
}
export default SettingsPage