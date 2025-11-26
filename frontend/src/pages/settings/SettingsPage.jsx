import { useState, useEffect } from 'react'
import { Users, Clock, Mail, Send, Trash2, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { workspaceInvitationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import InviteMemberModal from '../../components/workspace/InviteMemberModal'

const SettingsPage = () => {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentWorkspace?._id) {
      loadInvitations()
    }
  }, [currentWorkspace])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      console.log('Loading invitations for workspace:', currentWorkspace._id)
      const res = await workspaceInvitationAPI.getByWorkspace(currentWorkspace._id)
      console.log('Invitations response:', res)
      console.log('Invitations data:', res.data)
      setPendingInvitations(res.data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId) => {
    try {
      await workspaceInvitationAPI.cancel(invitationId)
      toast.success('Invitation cancelled')
      loadInvitations()
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

  const userRole = user?.workspaces?.find(w => {
    const wsId = w.workspace?._id || w.workspace?.id || w.workspace
    const currentWsId = currentWorkspace?._id || currentWorkspace?.id
    return wsId?.toString() === currentWsId?.toString()
  })?.role || 'member'

  console.log('User workspaces:', user?.workspaces)
  console.log('Current workspace ID:', currentWorkspace?._id)
  console.log('Detected role:', userRole)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Workspace Settings</h1>
        
        {/* Current Workspace Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentWorkspace?.name || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your role: <span className="font-medium capitalize">{userRole}</span>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workspace Members
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.name || user?.email} <span className="text-xs text-gray-500">(You)</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userRole === 'owner' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  : userRole === 'admin'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading invitations...</p>
          ) : pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => {
            setShowInviteModal(false)
            loadInvitations()
          }}
        />
      )}
    </div>
  )
}

export default SettingsPage