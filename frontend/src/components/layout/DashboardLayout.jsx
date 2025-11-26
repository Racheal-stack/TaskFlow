import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  CheckCircle,
  LogOut,
  AlertTriangle,
  ChevronDown,
  Building2,
  Mail,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { workspaceInvitationAPI } from '../../services/api'
import ThemeToggle from '../common/ThemeToggle'
import Sidebar from '../workspace/Sidebar'
import InviteMemberModal from '../workspace/InviteMemberModal'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
const DashboardLayout = ({ children }) => {
  const { user, logout, switchWorkspace } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const workspaceMenuRef = useRef(null)

  // Load pending invitations
  useEffect(() => {
    if (user) {
      loadPendingInvitations()
    }
  }, [user])

  // Close workspace menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target)) {
        setShowWorkspaceMenu(false)
      }
    }

    if (showWorkspaceMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWorkspaceMenu])

  const loadPendingInvitations = async () => {
    try {
      const response = await workspaceInvitationAPI.getMyInvitations()
      setPendingInvitations(response.data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
    }
  }

  // Debug: Check if currentWorkspace is set
  console.log('currentWorkspace:', currentWorkspace)
  console.log('user:', user)

  const handleListClick = (list) => {
    setSelectedList(list)
    // TODO: Navigate to list view or update main content
    console.log('List selected:', list)
  }

  const handleAddFolder = (space) => {
    // TODO: Open modal to create folder
    console.log('Add folder to space:', space)
  }

  const handleAddList = (space, folder) => {
    // TODO: Open modal to create list
    console.log('Add list to:', { space, folder })
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* New Sidebar with ClickUp hierarchy */}
      <Sidebar
        onListClick={handleListClick}
        onAddFolder={handleAddFolder}
        onAddList={handleAddList}
      />

      {/* Top Bar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  TaskFlow
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle size="sm" />
              
              <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-700 pl-4">
                {/* Company Name with Dropdown */}
                <div className="relative" ref={workspaceMenuRef}>
                  <button
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-xs">
                        {currentWorkspace?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentWorkspace?.name || user?.name || 'Company'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Workspace Dropdown */}
                  {showWorkspaceMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      {/* Pending Invitations Section */}
                      {pendingInvitations.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              Pending Invitations ({pendingInvitations.length})
                            </p>
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {pendingInvitations.map((invitation) => (
                              <button
                                key={invitation._id}
                                onClick={() => {
                                  navigate(`/invite/${invitation.token}`)
                                  setShowWorkspaceMenu(false)
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {invitation.workspace?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      from {invitation.invitedBy?.name}
                                    </p>
                                  </div>
                                  <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Switch Workspace Section */}
                      {user?.workspaces && user.workspaces.length > 1 && (
                        <>
                          <div className={`px-3 py-2 ${pendingInvitations.length > 0 ? 'border-t' : ''} border-b border-gray-200 dark:border-gray-700`}>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Switch Workspace
                            </p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {user.workspaces.map((ws) => {
                              const workspace = ws.workspace;
                              const isActive = currentWorkspace?._id === workspace?._id;
                              if (isActive) return null;
                              return (
                                <button
                                  key={workspace?._id}
                                  onClick={async () => {
                                    await switchWorkspace(workspace._id);
                                    setShowWorkspaceMenu(false);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {workspace?.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {ws.role}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className={`px-2 py-2 ${(pendingInvitations.length > 0 || (user?.workspaces && user.workspaces.length > 1)) ? 'border-t border-gray-200 dark:border-gray-700' : ''} space-y-2`}>
                        {/* Invite Members Button */}
                        <button
                          onClick={() => {
                            setShowInviteModal(true)
                            setShowWorkspaceMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite Members
                        </button>
                        
                        {/* Create Workspace Button */}
                        <button
                          onClick={() => {
                            setShowCreateWorkspaceModal(true)
                            setShowWorkspaceMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          Create Workspace
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Confirm Sign Out
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to sign out of your account?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        onWorkspaceCreated={() => {
          // Workspace list will auto-update after reload
        }}
      />
    </div>
  )
}
export default DashboardLayout