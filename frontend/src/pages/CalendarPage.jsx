import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  MapPin, 
  Video,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Activity,
  FolderOpen,
  History,
  Inbox,
  Settings
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { meetingAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import MeetingModal from '../components/meetings/MeetingModal'
import MeetingCard from '../components/meetings/MeetingCard'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'

const CalendarPage = () => {
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [viewMode, setViewMode] = useState('week') // 'day', 'week', 'month'

  // Get week range
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })

  // Fetch meetings
  const { 
    data: meetingsData, 
    isLoading, 
    error 
  } = useQuery(
    ['meetings', viewMode, selectedDate.toISOString()],
    () => meetingAPI.getAll({
      startDate: viewMode === 'week' ? weekStart.toISOString() : selectedDate.toISOString(),
      endDate: viewMode === 'week' ? weekEnd.toISOString() : new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }),
    {
      keepPreviousData: true
    }
  )

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation(meetingAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('meetings')
      toast.success('Meeting deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete meeting')
    }
  })

  // Update meeting response mutation
  const updateResponseMutation = useMutation(
    ({ id, status }) => meetingAPI.updateResponse(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('meetings')
        toast.success('Response updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update response')
      }
    }
  )

  const meetings = meetingsData?.meetings || []

  // Generate time slots for the day view
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    return {
      time: hour,
      label: format(new Date().setHours(hour, 0, 0, 0), 'ha')
    }
  })

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get meetings for a specific day and hour
  const getMeetingsForSlot = (date, hour) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.startTime)
      return isSameDay(meetingDate, date) && meetingDate.getHours() === hour
    })
  }

  // Get all meetings for a day
  const getMeetingsForDay = (date) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.startTime)
      return isSameDay(meetingDate, date)
    })
  }

  const handleCreateMeeting = (timeSlot = null, date = null) => {
    const defaultTime = timeSlot ? 
      new Date(date || selectedDate).setHours(timeSlot, 0, 0, 0) :
      new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    setSelectedMeeting({
      startTime: new Date(defaultTime),
      endTime: new Date(defaultTime + 60 * 60 * 1000) // 1 hour duration
    })
    setShowMeetingModal(true)
  }

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setShowMeetingModal(true)
  }

  const handleDeleteMeeting = (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      deleteMeetingMutation.mutate(meetingId)
    }
  }

  const handleModalClose = () => {
    setShowMeetingModal(false)
    setSelectedMeeting(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100'
      case 'declined':
        return 'text-red-600 bg-red-100'
      case 'maybe':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading meetings: {error.message}</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {format(selectedDate, 'MMMM yyyy')}
                  </p>
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="ml-2 px-3 py-1 text-xs bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-colors font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'day'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'week'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'month'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                >
                  Month
                </button>
              </div>

              <button
                onClick={() => handleCreateMeeting()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 m-6">
              {/* Week header */}
              <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
                <div className="p-4 border-r border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Time</div>
                </div>
                {weekDays.map((day, index) => {
                  const isToday = isSameDay(day, new Date())
                  const dayMeetings = getMeetingsForDay(day)
                  return (
                    <div key={index} className={`p-4 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-700 transition-colors ${
                      isToday 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600'
                    }`}>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-lg font-bold ${
                        isToday 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {dayMeetings.length > 0 && (
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                          isToday
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                          {dayMeetings.length} meeting{dayMeetings.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Time slots */}
              <div className="max-h-96 overflow-y-auto">
                {timeSlots.map((slot, slotIndex) => {
                  const isEvenHour = slotIndex % 2 === 0
                  return (
                    <div key={slot.time} className={`grid grid-cols-8 border-b last:border-b-0 min-h-[60px] border-gray-200 dark:border-gray-700 ${
                      isEvenHour 
                        ? 'bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-700/30' 
                        : 'bg-white dark:bg-gray-800'
                    }`}>
                      <div className="p-3 border-r border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-center">
                          {slot.label}
                        </span>
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const dayMeetings = getMeetingsForSlot(day, slot.time)
                        const isToday = isSameDay(day, new Date())
                        return (
                          <div 
                            key={dayIndex} 
                            className={`p-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700 cursor-pointer relative transition-all duration-200 ${
                              isToday 
                                ? 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                            onClick={() => handleCreateMeeting(slot.time, day)}
                          >
                            {dayMeetings.map((meeting) => (
                              <div
                                key={meeting._id}
                                className="mb-1 relative"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditMeeting(meeting)
                                }}
                              >
                                <MeetingCard meeting={meeting} compact />
                              </div>
                            ))}
                            {/* Time slot indicator */}
                            {dayMeetings.length === 0 && isToday && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                                  <Plus className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Meeting Modal */}
        {showMeetingModal && (
          <MeetingModal
            meeting={selectedMeeting}
            isOpen={showMeetingModal}
            onClose={handleModalClose}
            onSave={() => {
              queryClient.invalidateQueries('meetings')
              handleModalClose()
            }}
          />
        )}
      </DashboardLayout>
  )
}

export default CalendarPage