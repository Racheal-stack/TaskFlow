import React from 'react'
import { format, parseISO } from 'date-fns'
import { Clock, Users, MapPin, Video } from 'lucide-react'

const MeetingCard = ({ meeting, compact = false }) => {
  const startTime = parseISO(meeting.startTime)
  const endTime = parseISO(meeting.endTime)
  
  // Get color based on meeting type or custom color
  const getTypeColor = (type) => {
    const colors = {
      meeting: 'from-blue-400 to-blue-600',
      call: 'from-green-400 to-green-600',
      workshop: 'from-purple-400 to-purple-600',
      presentation: 'from-orange-400 to-orange-600',
      other: 'from-gray-400 to-gray-600'
    }
    return colors[type] || 'from-blue-400 to-blue-600'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-l-4 border-gradient-to-r from-gray-300 to-gray-500',
      medium: 'border-l-4 border-gradient-to-r from-yellow-300 to-yellow-500',
      high: 'border-l-4 border-gradient-to-r from-red-300 to-red-500'
    }
    return colors[priority] || 'border-l-4 border-gradient-to-r from-gray-300 to-gray-500'
  }

  const getCardBackground = (type, priority) => {
    const baseColors = {
      meeting: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10',
      call: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10',
      workshop: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10',
      presentation: 'from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10',
      other: 'from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10'
    }
    return baseColors[type] || baseColors.meeting
  }

  if (compact) {
    return (
      <div 
        className={`text-xs p-3 rounded-lg bg-gradient-to-r ${getCardBackground(meeting.type, meeting.priority)} shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-200 border-l-4 border-gradient-to-b ${getTypeColor(meeting.type)}`}
        style={{ backgroundColor: meeting.color ? `${meeting.color}15` : undefined }}
      >
        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={meeting.title}>
          {meeting.title}
        </div>
        <div className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
          {format(startTime, 'h:mm a')}
        </div>
        {meeting.attendees.length > 0 && (
          <div className="flex items-center text-gray-500 dark:text-gray-400 mt-2">
            <Users className="w-3 h-3 mr-1" />
            <span className="font-medium">{meeting.attendees.length}</span>
          </div>
        )}
        {/* Type indicator */}
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTypeColor(meeting.type)} absolute top-2 right-2 shadow-sm`} />
      </div>
    )
  }

  return (
    <div 
      className={`p-6 rounded-xl bg-gradient-to-r ${getCardBackground(meeting.type, meeting.priority)} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-102 border border-white/20 backdrop-blur-sm`}
      style={{ backgroundColor: meeting.color ? `${meeting.color}10` : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 text-lg">
            {meeting.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 mr-2 text-purple-600" />
              <span className="font-medium">{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
            </div>
            {meeting.attendees.length > 0 && (
              <div className="flex items-center bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">{meeting.attendees.length}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getTypeColor(meeting.type)} shadow-md`} 
                title={meeting.type} />
          {meeting.meetingLink && (
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Video className="w-4 h-4 text-white" title="Has meeting link" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {meeting.description && (
        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
          {meeting.description}
        </p>
      )}

      {/* Location */}
      {meeting.location && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {meeting.location}
        </div>
      )}

      {/* Attendees */}
      {meeting.attendees.length > 0 && (
        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 3).map((attendee, index) => {
              const gradients = [
                'from-purple-400 to-pink-400',
                'from-blue-400 to-cyan-400',
                'from-green-400 to-teal-400',
                'from-orange-400 to-red-400',
                'from-indigo-400 to-purple-400'
              ]
              const gradient = gradients[index % gradients.length]
              
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${gradient} border-3 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-md`}
                  title={attendee.user.name}
                >
                  {attendee.user.name.charAt(0).toUpperCase()}
                </div>
              )
            })}
            {meeting.attendees.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 border-3 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-bold shadow-md">
                +{meeting.attendees.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">
            {meeting.attendees.length} attendee{meeting.attendees.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/30 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            meeting.status === 'scheduled' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
            meeting.status === 'in-progress' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
            meeting.status === 'completed' ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' :
            'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}>
            {meeting.status}
          </span>
          
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            meeting.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
            meeting.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
            'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
          }`}>
            {meeting.priority}
          </span>
        </div>

        {meeting.project && (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">
            {meeting.project.name}
          </span>
        )}
      </div>
    </div>
  )
}

export default MeetingCard