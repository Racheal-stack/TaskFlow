import { useState, useEffect } from 'react'
import { Plus, List, LayoutGrid, Filter, Search, SlidersHorizontal, ChevronDown, Circle, CheckCircle2, Clock, Calendar, User, Flag, MoreHorizontal, GripVertical, Settings } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { listAPI, folderAPI, spaceAPI } from '../../services/api'
import toast from 'react-hot-toast'
import TaskModal from '../../components/tasks/TaskModal'
import TaskCard from '../../components/tasks/TaskCard'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusColumnModal from '../../components/tasks/StatusColumnModal'
import { useAuth } from '../../context/AuthContext'

const TasksPage = () => {
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [view, setView] = useState('list') // 'list' or 'board'
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [tasks, setTasks] = useState([])
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [statuses, setStatuses] = useState([
    { _id: '1', name: 'To Do', color: '#6B7280', type: 'todo', order: 0 },
    { _id: '2', name: 'In Progress', color: '#3B82F6', type: 'in-progress', order: 1 },
    { _id: '3', name: 'Done', color: '#10B981', type: 'done', order: 2 }
  ])
  const [userPermissions, setUserPermissions] = useState({
    canCreateStatuses: false,
    canEditStatuses: false,
    canDeleteStatuses: false,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [groupBy, setGroupBy] = useState('status') // 'status', 'priority', 'list'
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (currentWorkspace?._id) {
      loadLists()
      loadTasks()
      
      // Set default permissions based on user role
      const userWorkspace = user?.workspaces?.find(
        w => (w.workspace?._id || w.workspace) === currentWorkspace?._id
      )
      const userRole = userWorkspace?.role
      const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'
      
      if (isOwnerOrAdmin) {
        setUserPermissions({
          canCreateStatuses: true,
          canEditStatuses: true,
          canDeleteStatuses: true,
          canViewTasks: true,
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true
        })
      }
    }
  }, [currentWorkspace, user])

  useEffect(() => {
    if (selectedList) {
      loadListDetails()
    }
  }, [selectedList])

  const loadLists = async () => {
    try {
      const res = await listAPI.getAll({ workspaceId: currentWorkspace._id })
      const loadedLists = res.data || []
      setLists(loadedLists)
      
      // Auto-select first list if available
      if (loadedLists.length > 0 && !selectedList) {
        setSelectedList(loadedLists[0])
      }
    } catch (error) {
      console.error('Error loading lists:', error)
    }
  }

  const loadListDetails = async () => {
    try {
      const res = await listAPI.getById(selectedList._id)
      const listData = res.data
      
      // Set statuses from the list or use defaults
      setStatuses(listData.statuses || [
        { _id: '1', name: 'To Do', color: '#6B7280', type: 'todo', order: 0 },
        { _id: '2', name: 'In Progress', color: '#3B82F6', type: 'in-progress', order: 1 },
        { _id: '3', name: 'Done', color: '#10B981', type: 'done', order: 2 }
      ])

      // Check user permissions
      checkUserPermissions(listData)
    } catch (error) {
      console.error('Error loading list details:', error)
    }
  }

  const checkUserPermissions = (listData) => {
    // Check if user is owner or admin of workspace
    const userWorkspace = user?.workspaces?.find(
      w => (w.workspace?._id || w.workspace) === currentWorkspace?._id
    )
    const userRole = userWorkspace?.role
    const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'
    
    const permissions = {
      canCreateStatuses: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        listData.permissions?.canCreateStatuses?.includes(user?._id) || false,
      canEditStatuses: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        listData.permissions?.canEditStatuses?.includes(user?._id) || false,
      canDeleteStatuses: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        listData.permissions?.canDeleteStatuses?.includes(user?._id) || false,
      canViewTasks: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        !listData.permissions?.canViewTasks?.length ||
        listData.permissions?.canViewTasks?.includes(user?._id) || true,
      canCreateTasks: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        !listData.permissions?.canCreateTasks?.length ||
        listData.permissions?.canCreateTasks?.includes(user?._id) || true,
      canEditTasks: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        !listData.permissions?.canEditTasks?.length ||
        listData.permissions?.canEditTasks?.includes(user?._id) || true,
      canDeleteTasks: isOwnerOrAdmin || 
        listData.createdBy === user?._id || 
        !listData.permissions?.canDeleteTasks?.length ||
        listData.permissions?.canDeleteTasks?.includes(user?._id) || true,
    }
    setUserPermissions(permissions)
  }

  const handleCreateStatus = async (statusData) => {
    if (!selectedList) {
      toast.error('Please select a list first')
      return
    }

    try {
      const res = await listAPI.addStatus(selectedList._id, statusData)
      const updatedList = res.data
      setStatuses(updatedList.statuses)
      toast.success('Status column created successfully!')
      setShowStatusModal(false)
    } catch (error) {
      console.error('Error creating status:', error)
      toast.error(error.response?.data?.message || 'Failed to create status')
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const mockTasks = [
        {
          _id: '1',
          title: 'Design new landing page',
          description: 'Create wireframes and mockups for the new homepage',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2025-12-01',
          list: { _id: 'list1', name: 'Marketing' },
          assignee: { name: 'John Doe', avatar: null },
          createdAt: new Date()
        },
        {
          _id: '2',
          title: 'Fix login bug',
          description: 'Users reported issues with password reset',
          status: 'todo',
          priority: 'urgent',
          dueDate: '2025-11-28',
          list: { _id: 'list2', name: 'Development' },
          createdAt: new Date()
        },
        {
          _id: '3',
          title: 'Update documentation',
          description: 'Add API documentation for new endpoints',
          status: 'review',
          priority: 'medium',
          dueDate: '2025-12-05',
          list: { _id: 'list2', name: 'Development' },
          assignee: { name: 'Jane Smith', avatar: null },
          createdAt: new Date()
        },
        {
          _id: '4',
          title: 'Setup CI/CD pipeline',
          description: 'Configure GitHub Actions for automated deployments',
          status: 'todo',
          priority: 'high',
          dueDate: '2025-12-03',
          list: { _id: 'list2', name: 'Development' },
          createdAt: new Date()
        },
        {
          _id: '5',
          title: 'Client meeting',
          description: 'Quarterly review with stakeholders',
          status: 'done',
          priority: 'medium',
          dueDate: '2025-11-26',
          list: { _id: 'list1', name: 'Marketing' },
          assignee: { name: 'John Doe', avatar: null },
          createdAt: new Date()
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (taskData) => {
    try {
      const selectedList = lists.find(l => l._id === taskData.list)
      const newTask = {
        _id: Date.now().toString(),
        ...taskData,
        list: selectedList ? { _id: selectedList._id, name: selectedList.name } : null,
        createdAt: new Date()
      }
      setTasks([newTask, ...tasks])
      toast.success('Task created successfully!')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      setTasks(tasks.map(t => 
        t._id === task._id ? { ...t, status: newStatus } : t
      ))
      toast.success(`Task updated`)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getTasksByGroup = () => {
    if (groupBy === 'status') {
      return {
        'To Do': filteredTasks.filter(t => t.status === 'todo'),
        'In Progress': filteredTasks.filter(t => t.status === 'in_progress'),
        'Review': filteredTasks.filter(t => t.status === 'review'),
        'Done': filteredTasks.filter(t => t.status === 'done')
      }
    } else if (groupBy === 'priority') {
      return {
        'Urgent': filteredTasks.filter(t => t.priority === 'urgent'),
        'High': filteredTasks.filter(t => t.priority === 'high'),
        'Medium': filteredTasks.filter(t => t.priority === 'medium'),
        'Low': filteredTasks.filter(t => t.priority === 'low')
      }
    } else if (groupBy === 'list') {
      const grouped = {}
      filteredTasks.forEach(task => {
        const listName = task.list?.name || 'No List'
        if (!grouped[listName]) grouped[listName] = []
        grouped[listName].push(task)
      })
      return grouped
    }
    return { 'All Tasks': filteredTasks }
  }

  const groupedTasks = getTasksByGroup()

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ClickUp-style Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              
              {/* List Selector */}
              <select
                value={selectedList?._id || ''}
                onChange={(e) => {
                  const list = lists.find(l => l._id === e.target.value)
                  setSelectedList(list)
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Lists</option>
                {lists.map(list => (
                  <option key={list._id} value={list._id}>{list.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium rounded">
                  {stats.total} total
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium rounded">
                  {stats.inProgress} active
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              disabled={!userPermissions.canCreateTasks}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={!userPermissions.canCreateTasks ? 'You do not have permission to create tasks' : ''}
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                />
              </div>

              {/* Group By */}
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="status">Group by Status</option>
                  <option value="priority">Group by Priority</option>
                  <option value="list">Group by List</option>
                  <option value="none">No Grouping</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                  view === 'list'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                  view === 'board'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="py-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : view === 'list' ? (
          /* ClickUp-style List View */
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{groupName}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({groupTasks.length})</span>
                  </div>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {groupTasks.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No tasks in this group
                    </div>
                  ) : (
                    groupTasks.map(task => (
                      <div
                        key={task._id}
                        onClick={() => handleTaskClick(task)}
                        className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')
                          }}
                        >
                          {task.status === 'done' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-purple-500 transition-colors" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.assignee && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                              <User className="w-3 h-3" />
                              {task.assignee.name}
                            </div>
                          )}
                          
                          {task.dueDate && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                              new Date(task.dueDate) < new Date() && task.status !== 'done'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            <Flag className="w-3 h-3 inline mr-1" />
                            {task.priority}
                          </div>

                          {task.list && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded text-xs font-medium">
                              {task.list.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ClickUp-style Board View with Dynamic Status Columns */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.sort((a, b) => a.order - b.order).map((status) => {
              // Match tasks by status - handle both "To Do" format and "todo" format
              const statusKey = status.name.toLowerCase().replace(/ /g, '_')
              const statusTasks = filteredTasks.filter(t => {
                const taskStatus = t.status?.toLowerCase().replace(/ /g, '_')
                return taskStatus === statusKey || 
                       taskStatus === status.type || 
                       t.status === status.name
              })
              return (
                <div key={status._id} className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{status.name}</h3>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{statusTasks.length}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {statusTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onTaskClick={handleTaskClick}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                    {statusTasks.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-8">No tasks</p>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Add New Column Button */}
            {userPermissions.canCreateStatuses && (
              <div className="flex-shrink-0 w-80">
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">Add Column</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={handleCreateTask}
          lists={lists}
        />
      )}

      {/* Status Column Modal */}
      {showStatusModal && (
        <StatusColumnModal
          onClose={() => setShowStatusModal(false)}
          onStatusCreated={handleCreateStatus}
          listId={selectedList?._id}
        />
      )}
    </div>
    </DashboardLayout>
  )
}

export default TasksPage
