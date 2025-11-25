import { Clock, User } from 'lucide-react'

const UpcomingTasks = () => {
  const tasks = [
    {
      id: 1,
      title: 'Research',
      subtitle: 'UI Research',
      time: '10 Am',
      duration: '1.5 Am',
      category: '3 Pm',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    },
    {
      id: 2, 
      title: 'Landing Page Design',
      subtitle: 'Web Design',
      time: '11 Am',
      duration: '2 Am',
      category: '4 Pm', 
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
    },
    {
      id: 3,
      title: 'Dashboard Design', 
      subtitle: 'UI Design',
      time: '12 Pm',
      duration: '3 Pm',
      category: '5 Pm',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
    },
    {
      id: 4,
      title: 'Design Theory',
      subtitle: 'Research',
      time: '2 Pm',
      duration: '1 Pm', 
      category: '3 Pm',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Wednesday, 17 March, 2021
        </span>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            {/* Time */}
            <div className="flex-shrink-0 w-12 text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {task.time}
              </div>
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.subtitle}
                  </p>
                </div>
                
                {/* Duration and Category */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {task.duration}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {task.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full ${task.color.includes('bg-purple') ? 'bg-purple-400' : 
              task.color.includes('bg-orange') ? 'bg-orange-400' :
              task.color.includes('bg-green') ? 'bg-green-400' : 'bg-blue-400'}`}>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors">
          View All Tasks
        </button>
      </div>
    </div>
  )
}

export default UpcomingTasks