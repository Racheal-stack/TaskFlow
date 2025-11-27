import { Calendar, Flag, User, MoreVertical, CheckCircle2, Circle } from 'lucide-react'

const TaskCard = ({ task, onTaskClick, onStatusChange }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'review':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && task.status !== 'done'
  }

  return (
    <div
      onClick={() => onTaskClick(task)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(task, task.status === 'done' ? 'todo' : 'done')
            }}
            className="mt-0.5"
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-purple-500 transition-colors" />
            )}
          </button>
          <div className="flex-1">
            <h3 className={`font-medium text-gray-900 dark:text-white mb-1 ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Priority Badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          <Flag className="w-3 h-3" />
          {task.priority}
        </span>

        {/* Status Badge */}
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>

        {/* Due Date */}
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
            isOverdue(task.dueDate) 
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20' 
              : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
          </span>
        )}

        {/* Assignee */}
        {task.assignee && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            <User className="w-3 h-3" />
            {task.assignee.name || task.assignee.email}
          </span>
        )}
      </div>
    </div>
  )
}

export default TaskCard
