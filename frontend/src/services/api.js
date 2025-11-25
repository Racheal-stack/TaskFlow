import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    
    // Handle specific error status codes
    if (error.response?.status === 401) {
      // Unauthorized - token expired or invalid
      Cookies.remove('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      toast.error('You do not have permission to perform this action')
    } else if (error.response?.status === 404) {
      // Not found
      toast.error('Requested resource not found')
    } else if (error.response?.status === 429) {
      // Rate limit exceeded
      toast.error('Too many requests. Please try again later.')
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error('Server error. Please try again later.')
    }
    
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (verificationData) => api.post('/auth/verify-email', verificationData),
  resendVerificationCode: (emailData) => api.post('/auth/resend-verification', emailData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  switchWorkspace: (workspaceId) => api.post('/auth/switch-workspace', workspaceId),
}

// Workspace API
export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getById: (id) => api.get(`/workspaces/${id}`),
  create: (workspaceData) => api.post('/workspaces', workspaceData),
  update: (id, workspaceData) => api.put(`/workspaces/${id}`, workspaceData),
  delete: (id) => api.delete(`/workspaces/${id}`),
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  addMember: (id, memberData) => api.post(`/workspaces/${id}/members`, memberData),
  updateMember: (id, memberId, memberData) => api.put(`/workspaces/${id}/members/${memberId}`, memberData),
  removeMember: (id, memberId) => api.delete(`/workspaces/${id}/members/${memberId}`),
  getInviteLink: (id) => api.get(`/workspaces/${id}/invite-link`),
  generateInviteLink: (id) => api.post(`/workspaces/${id}/invite-link`),
  joinByInvite: (token) => api.post('/workspaces/join', { token }),
}

// Project API
export const projectAPI = {
  getAll: (workspaceId, params = {}) => api.get(`/workspaces/${workspaceId}/projects`, { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (workspaceId, projectData) => api.post(`/workspaces/${workspaceId}/projects`, projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  duplicate: (id) => api.post(`/projects/${id}/duplicate`),
  archive: (id) => api.put(`/projects/${id}/archive`),
  unarchive: (id) => api.put(`/projects/${id}/unarchive`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, memberData) => api.post(`/projects/${id}/members`, memberData),
  updateMember: (id, memberId, memberData) => api.put(`/projects/${id}/members/${memberId}`, memberData),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
  updateColumns: (id, columns) => api.put(`/projects/${id}/columns`, { columns }),
}

// Task API
export const taskAPI = {
  getAll: (projectId, params = {}) => api.get(`/projects/${projectId}/tasks`, { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  move: (id, moveData) => api.put(`/tasks/${id}/move`, moveData),
  assign: (id, assignData) => api.put(`/tasks/${id}/assign`, assignData),
  unassign: (id, userId) => api.delete(`/tasks/${id}/assign/${userId}`),
  addComment: (id, commentData) => api.post(`/tasks/${id}/comments`, commentData),
  updateComment: (id, commentId, commentData) => api.put(`/tasks/${id}/comments/${commentId}`, commentData),
  deleteComment: (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`),
  uploadAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttachment: (id, attachmentId) => api.delete(`/tasks/${id}/attachments/${attachmentId}`),
  updateChecklist: (id, checklist) => api.put(`/tasks/${id}/checklist`, { checklist }),
  logTime: (id, timeData) => api.post(`/tasks/${id}/time`, timeData),
  getTimeLog: (id) => api.get(`/tasks/${id}/time`),
}

// User API
export const userAPI = {
  search: (query, workspaceId) => api.get('/users/search', { 
    params: { q: query, workspace: workspaceId } 
  }),
  getProfile: (id) => api.get(`/users/${id}`),
  updateAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Subscription API
export const subscriptionAPI = {
  getCurrent: (workspaceId) => api.get(`/workspaces/${workspaceId}/subscription`),
  createCheckoutSession: (workspaceId, priceId) => api.post('/subscriptions/create-checkout-session', {
    workspaceId,
    priceId
  }),
  createPortalSession: (workspaceId) => api.post('/subscriptions/create-portal-session', {
    workspaceId
  }),
  getUsage: (workspaceId) => api.get(`/workspaces/${workspaceId}/usage`),
  cancelSubscription: (workspaceId) => api.post(`/workspaces/${workspaceId}/subscription/cancel`),
}

// Meeting API
export const meetingAPI = {
  getAll: (params = {}) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (meetingData) => api.post('/meetings', meetingData),
  update: (id, meetingData) => api.put(`/meetings/${id}`, meetingData),
  delete: (id) => api.delete(`/meetings/${id}`),
  updateResponse: (id, status) => api.put(`/meetings/${id}/response`, { status }),
  getUpcoming: () => api.get('/meetings/upcoming'),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (workspaceId, period = '30d') => api.get(`/workspaces/${workspaceId}/analytics/dashboard`, {
    params: { period }
  }),
  getProjectStats: (projectId, period = '30d') => api.get(`/projects/${projectId}/analytics`, {
    params: { period }
  }),
  getTaskMetrics: (workspaceId, params = {}) => api.get(`/workspaces/${workspaceId}/analytics/tasks`, {
    params
  }),
  getUserActivity: (workspaceId, params = {}) => api.get(`/workspaces/${workspaceId}/analytics/activity`, {
    params
  }),
  exportData: (workspaceId, format = 'csv') => api.get(`/workspaces/${workspaceId}/export`, {
    params: { format },
    responseType: 'blob'
  }),
}

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (preferences) => api.put('/notifications/preferences', preferences),
}

// File upload helper
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      onProgress?.(percentCompleted)
    },
  })
}

// Utility functions
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error.response?.data?.message || error.message || defaultMessage
  toast.error(message)
  return message
}

export const formatApiDate = (date) => {
  return new Date(date).toISOString()
}

export default api