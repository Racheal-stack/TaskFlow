import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'react-query'
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Video, 
  FileText,
  Plus,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { meetingAPI, projectAPI, userAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const MeetingModal = ({ meeting, isOpen, onClose, onSave }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'meeting',
    priority: 'medium',
    attendees: [],
    meetingLink: '',
    color: '#3b82f6',
    project: '',
    reminders: [{ time: 15 }]
  })
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [errors, setErrors] = useState({})

  // Initialize form data when meeting changes
  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        startTime: meeting.startTime ? 
          format(new Date(meeting.startTime), "yyyy-MM-dd'T'HH:mm") : '',
        endTime: meeting.endTime ? 
          format(new Date(meeting.endTime), "yyyy-MM-dd'T'HH:mm") : '',
        location: meeting.location || '',
        type: meeting.type || 'meeting',
        priority: meeting.priority || 'medium',
        attendees: meeting.attendees ? 
          meeting.attendees.map(a => a.user?.email || a.email) : [],
        meetingLink: meeting.meetingLink || '',
        color: meeting.color || '#3b82f6',
        project: meeting.project?._id || '',
        reminders: meeting.reminders?.length > 0 ? 
          meeting.reminders : [{ time: 15 }]
      })
    } else {
      // Reset for new meeting
      const now = new Date()
      const startTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
      
      setFormData({
        title: '',
        description: '',
        startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
        location: '',
        type: 'meeting',
        priority: 'medium',
        attendees: [],
        meetingLink: '',
        color: '#3b82f6',
        project: '',
        reminders: [{ time: 15 }]
      })
    }
  }, [meeting])

  // Fetch projects for workspace
  const { data: projectsData } = useQuery(
    ['projects', user?.currentWorkspace],
    () => projectAPI.getAll(user.currentWorkspace),
    {
      enabled: !!user?.currentWorkspace
    }
  )

  // Create/Update meeting mutation
  const saveMeetingMutation = useMutation(
    (meetingData) => {
      if (meeting?._id) {
        return meetingAPI.update(meeting._id, meetingData)
      } else {
        return meetingAPI.create(meetingData)
      }
    },
    {
      onSuccess: () => {
        toast.success(meeting?._id ? 'Meeting updated successfully' : 'Meeting created successfully')
        onSave()
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to save meeting'
        toast.error(message)
        setErrors(error.response?.data?.errors || {})
      }
    }
  )

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addAttendee = () => {
    if (attendeeEmail && !formData.attendees.includes(attendeeEmail)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, attendeeEmail]
      }))
      setAttendeeEmail('')
    }
  }

  const removeAttendee = (email) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email)
    }))
  }

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, { time: 15 }]
    }))
  }

  const updateReminder = (index, time) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((r, i) => 
        i === index ? { ...r, time: parseInt(time) } : r
      )
    }))
  }

  const removeReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Prepare data for API
    const meetingData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      project: formData.project || undefined
    }

    saveMeetingMutation.mutate(meetingData)
  }

  if (!isOpen) return null

  const projects = projectsData?.projects || []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {meeting?._id ? 'Edit Meeting' : 'Create New Meeting'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Meeting title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time *
                  </label>
                  <div className="mt-1 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className={`block w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.startTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Time *
                  </label>
                  <div className="mt-1 relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className={`block w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.endTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
                </div>
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="workshop">Workshop</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Meeting location or room"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meeting Link
                </label>
                <div className="mt-1 relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>

              {/* Project */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1 relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Meeting agenda or description"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attendees
                </label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter email address"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addAttendee()
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addAttendee}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {formData.attendees.length > 0 && (
                    <div className="space-y-1">
                      {formData.attendees.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            type="button"
                            onClick={() => removeAttendee(email)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMeetingMutation.isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
              >
                {saveMeetingMutation.isLoading && <LoadingSpinner size="sm" />}
                {meeting?._id ? 'Update Meeting' : 'Create Meeting'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MeetingModal