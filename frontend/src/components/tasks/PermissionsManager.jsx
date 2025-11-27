import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Shield, Eye, Edit, Trash, Plus } from 'lucide-react'
import { listAPI, userAPI } from '../../services/api'
import { useWorkspace } from '../../context/WorkspaceContext'
import toast from 'react-hot-toast'

const PermissionsManager = ({ list, onClose, onPermissionsUpdated }) => {
  const { currentWorkspace } = useWorkspace()
  const [permissions, setPermissions] = useState({
    canCreateStatuses: [],
    canEditStatuses: [],
    canDeleteStatuses: [],
    canViewTasks: [],
    canCreateTasks: [],
    canEditTasks: [],
    canDeleteTasks: [],
    canManagePermissions: []
  })
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPermissions()
    loadWorkspaceMembers()
  }, [list])

  const loadPermissions = async () => {
    try {
      const res = await listAPI.getPermissions(list._id)
      setPermissions(res.data || {})
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const loadWorkspaceMembers = async () => {
    try {
      // Load all workspace members
      const res = await userAPI.search('', currentWorkspace._id)
      setWorkspaceMembers(res.data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const handleAddPermission = async (permissionType, userId) => {
    try {
      const updatedPermissions = {
        ...permissions,
        [permissionType]: [...(permissions[permissionType] || []), userId]
      }
      
      const res = await listAPI.updatePermissions(list._id, updatedPermissions)
      setPermissions(res.data.permissions)
      toast.success('Permission added successfully')
      onPermissionsUpdated?.()
    } catch (error) {
      console.error('Error adding permission:', error)
      toast.error(error.response?.data?.message || 'Failed to add permission')
    }
  }

  const handleRemovePermission = async (permissionType, userId) => {
    try {
      const updatedPermissions = {
        ...permissions,
        [permissionType]: permissions[permissionType].filter(id => id !== userId)
      }
      
      const res = await listAPI.updatePermissions(list._id, updatedPermissions)
      setPermissions(res.data.permissions)
      toast.success('Permission removed successfully')
      onPermissionsUpdated?.()
    } catch (error) {
      console.error('Error removing permission:', error)
      toast.error(error.response?.data?.message || 'Failed to remove permission')
    }
  }

  const permissionTypes = [
    { key: 'canCreateStatuses', label: 'Create Status Columns', icon: Plus, description: 'Add new status columns to the board' },
    { key: 'canEditStatuses', label: 'Edit Status Columns', icon: Edit, description: 'Modify existing status columns' },
    { key: 'canDeleteStatuses', label: 'Delete Status Columns', icon: Trash, description: 'Remove status columns from the board' },
    { key: 'canViewTasks', label: 'View Tasks', icon: Eye, description: 'See tasks in this list' },
    { key: 'canCreateTasks', label: 'Create Tasks', icon: Plus, description: 'Add new tasks to this list' },
    { key: 'canEditTasks', label: 'Edit Tasks', icon: Edit, description: 'Modify existing tasks' },
    { key: 'canDeleteTasks', label: 'Delete Tasks', icon: Trash, description: 'Remove tasks from this list' },
    { key: 'canManagePermissions', label: 'Manage Permissions', icon: Shield, description: 'Modify list permissions' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              List Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage who can perform actions on "{list.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {permissionTypes.map((permType) => {
              const Icon = permType.icon
              const userIds = permissions[permType.key] || []
              const usersWithPermission = workspaceMembers.filter(m => userIds.includes(m._id))
              const usersWithoutPermission = workspaceMembers.filter(m => !userIds.includes(m._id))

              return (
                <div key={permType.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{permType.label}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{permType.description}</p>
                    </div>
                  </div>

                  {/* Users with permission */}
                  {usersWithPermission.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {usersWithPermission.map(user => (
                        <div key={user._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePermission(permType.key, user._id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove permission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add user dropdown */}
                  {usersWithoutPermission.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddPermission(permType.key, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">+ Add user...</option>
                      {usersWithoutPermission.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}

                  {userIds.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      All workspace members have this permission by default
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermissionsManager
