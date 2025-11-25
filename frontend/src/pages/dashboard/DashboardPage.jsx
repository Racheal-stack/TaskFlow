import { useState } from 'react'
import { Search, Users, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import TaskChart from '../../components/dashboard/TaskChart'
import WorkProgressChart from '../../components/dashboard/WorkProgressChart'
import WorkingStatusChart from '../../components/dashboard/WorkingStatusChart'
import CalendarWidget from '../../components/dashboard/CalendarWidget'

const DashboardPage = () => {
  const { user } = useAuth()
  const [activeProject, setActiveProject] = useState('mega project v')

  const stats = [
    { id: 1, value: '1220', label: 'Total Task', bgColor: 'bg-purple-100', textColor: 'text-purple-600', iconColor: 'text-purple-500' },
    { id: 2, value: '07', label: 'Completed Task', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', iconColor: 'text-cyan-500' },
    { id: 3, value: '48', label: 'In progress', bgColor: 'bg-orange-100', textColor: 'text-orange-600', iconColor: 'text-orange-500' },
    { id: 4, value: '1550', label: 'Total Member', bgColor: 'bg-green-100', textColor: 'text-green-600', iconColor: 'text-green-500' }
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            {/* Calendar Button */}
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </button>

            {/* Date Range */}
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">March 2021</div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome To
                  </h2>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Your Task Management Area
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                    Quis autem vel eum iure voluptate velit esse quam nihil molestiae
                  </p>
                  <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Learn More
                  </button>
                </div>
                
                {/* Illustration placeholder */}
                <div className="hidden lg:block w-80 h-60">
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center">
                    <Users className="w-24 h-24 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <StatCard key={stat.id} {...stat} />
              ))}
            </div>

            {/* Charts and Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* Total Work Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total work</h3>
                    <select className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Daily</option>
                    </select>
                  </div>
                  <TaskChart />
                </div>

                {/* Bottom Row - Work Progress and Working Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WorkProgressChart />
                  <WorkingStatusChart />
                </div>
              </div>

              {/* Right Column - Calendar */}
              <div className="space-y-8">
                <CalendarWidget />
              </div>
            </div>
          </div>
        </main>
    </DashboardLayout>
  )
}

export default DashboardPage