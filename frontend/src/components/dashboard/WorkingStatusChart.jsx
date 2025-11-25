const WorkingStatusChart = () => {
  const statusData = {
    working: 70,
    total: 100
  }

  const percentage = Math.round((statusData.working / statusData.total) * 100)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Working Status</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          •••
        </button>
      </div>

      {/* Circular Progress Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#8B5CF6"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {percentage}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Members Working
            </div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Working</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {statusData.working}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Not Working</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {statusData.total - statusData.working}
          </span>
        </div>
      </div>

      {/* Additional stats */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">8h</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg. Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">95%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingStatusChart