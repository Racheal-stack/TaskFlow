import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})
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
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    if (error.response?.status === 401) {
      Cookies.remove('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action')
    } else if (error.response?.status === 404) {
      toast.error('Requested resource not found')
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)
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
  createWorkspace: (workspaceData) => api.post('/workspaces', workspaceData),
}
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

// ClickUp-style Hierarchy APIs
export const spaceAPI = {
  getAll: (workspaceId) => api.get('/spaces', { params: { workspaceId } }),
  getById: (id) => api.get(`/spaces/${id}`),
  create: (spaceData) => api.post('/spaces', spaceData),
  update: (id, spaceData) => api.put(`/spaces/${id}`, spaceData),
  delete: (id) => api.delete(`/spaces/${id}`),
  restore: (id) => api.post(`/spaces/${id}/restore`),
  addMember: (id, memberData) => api.post(`/spaces/${id}/members`, memberData),
  removeMember: (id, userId) => api.delete(`/spaces/${id}/members/${userId}`),
  reorder: (spaceIds) => api.put('/spaces/reorder', { spaceIds }),
}

export const folderAPI = {
  getAll: (params = {}) => api.get('/folders', { params }), // params: { spaceId, workspaceId, parentId }
  getById: (id) => api.get(`/folders/${id}`),
  create: (folderData) => api.post('/folders', folderData),
  update: (id, folderData) => api.put(`/folders/${id}`, folderData),
  delete: (id) => api.delete(`/folders/${id}`),
  restore: (id) => api.post(`/folders/${id}/restore`),
  getPath: (id) => api.get(`/folders/${id}/path`),
  reorder: (folderIds) => api.put('/folders/reorder', { folderIds }),
}

export const listAPI = {
  getAll: (params = {}) => api.get('/lists', { params }), // params: { spaceId, folderId, workspaceId }
  getById: (id) => api.get(`/lists/${id}`),
  create: (listData) => api.post('/lists', listData),
  update: (id, listData) => api.put(`/lists/${id}`, listData),
  delete: (id) => api.delete(`/lists/${id}`),
  restore: (id) => api.post(`/lists/${id}/restore`),
  addStatus: (id, statusData) => api.post(`/lists/${id}/statuses`, statusData),
  updateStatus: (id, statusId, statusData) => api.put(`/lists/${id}/statuses/${statusId}`, statusData),
  deleteStatus: (id, statusId) => api.delete(`/lists/${id}/statuses/${statusId}`),
  removeStatus: (id, statusName) => api.delete(`/lists/${id}/statuses/${encodeURIComponent(statusName)}`),
  addCustomField: (id, fieldData) => api.post(`/lists/${id}/custom-fields`, fieldData),
  removeCustomField: (id, fieldName) => api.delete(`/lists/${id}/custom-fields/${encodeURIComponent(fieldName)}`),
  reorder: (listIds) => api.put('/lists/reorder', { listIds }),
  getPermissions: (id) => api.get(`/lists/${id}/permissions`),
  updatePermissions: (id, permissionsData) => api.put(`/lists/${id}/permissions`, permissionsData),
}

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
export const userAPI = {
  search: (query, workspaceId) => api.get('/users/search', { 
    params: { q: query, workspace: workspaceId } 
  }),
  getProfile: (id) => api.get(`/users/${id}`),
  updateAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}
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
export const meetingAPI = {
  getAll: (params = {}) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (meetingData) => api.post('/meetings', meetingData),
  update: (id, meetingData) => api.put(`/meetings/${id}`, meetingData),
  delete: (id) => api.delete(`/meetings/${id}`),
  updateResponse: (id, status) => api.put(`/meetings/${id}/response`, { status }),
  getUpcoming: () => api.get('/meetings/upcoming'),
}
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
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (preferences) => api.put('/notifications/preferences', preferences),
}

// Workspace Invitations API
export const workspaceInvitationAPI = {
  // Send invitation to join workspace
  sendInvitation: (data) => api.post('/workspace-invitations', data),
  
  // Get current user's pending invitations
  getMyInvitations: () => api.get('/workspace-invitations/my-invitations'),
  
  // Get all invitations for a workspace (admin only)
  getWorkspaceInvitations: (workspaceId) => api.get(`/workspace-invitations/workspace/${workspaceId}`),
  
  // Get invitation details by token (public)
  getInvitationByToken: (token) => api.get(`/workspace-invitations/${token}`),
  
  // Accept invitation
  acceptInvitation: (token) => api.post(`/workspace-invitations/${token}/accept`),
  
  // Decline invitation
  declineInvitation: (token) => api.post(`/workspace-invitations/${token}/decline`),
  
  // Cancel invitation (admin only)
  cancelInvitation: (invitationId) => api.delete(`/workspace-invitations/${invitationId}`)
};

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
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error.response?.data?.message || error.message || defaultMessage
  toast.error(message)
  return message
}
export const formatApiDate = (date) => {
  return new Date(date).toISOString()
}
export default api