import { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import Cookies from 'js-cookie'

const AuthContext = createContext()

// Auth state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const queryClient = useQueryClient()

  // Get current user
  const { data: userData, isLoading: userLoading, error } = useQuery(
    'auth/me',
    authAPI.getMe,
    {
      retry: false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_USER', payload: data.user })
      },
      onError: (error) => {
        console.log('Auth error:', error)
        dispatch({ type: 'LOGOUT' })
        Cookies.remove('token')
      },
      enabled: !!Cookies.get('token')
    }
  )

  // Set loading state based on query loading
  useEffect(() => {
    if (!Cookies.get('token')) {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'LOGOUT' })
    } else {
      dispatch({ type: 'SET_LOADING', payload: userLoading })
    }
  }, [userLoading])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.login(credentials)
      
      // Set token in cookies
      Cookies.set('token', response.token, { 
        expires: 30, // 30 days
        secure: import.meta.env.PROD,
        sameSite: 'strict'
      })
      
      dispatch({ type: 'SET_USER', payload: response.user })
      queryClient.invalidateQueries('auth/me')
      
      toast.success(`Welcome back, ${response.user.name}!`)
      return response
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.register(userData)
      
      // Don't auto-login after registration - user needs to verify email first
      // Only show success message, verification will be handled by RegisterPage
      dispatch({ type: 'SET_LOADING', payload: false })
      
      return response
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      Cookies.remove('token')
      dispatch({ type: 'LOGOUT' })
      queryClient.clear()
      toast.success('Logged out successfully')
    }
  }

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      dispatch({ type: 'UPDATE_USER', payload: response.user })
      queryClient.invalidateQueries('auth/me')
      toast.success('Profile updated successfully')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      throw error
    }
  }

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      toast.success('Password changed successfully')
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      throw error
    }
  }

  // Switch workspace function
  const switchWorkspace = async (workspaceId) => {
    try {
      await authAPI.switchWorkspace({ workspaceId })
      dispatch({ 
        type: 'UPDATE_USER', 
        payload: { currentWorkspace: workspaceId }
      })
      queryClient.invalidateQueries()
      toast.success('Workspace switched successfully')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to switch workspace'
      toast.error(message)
      throw error
    }
  }

  // Check if user has workspace access
  const hasWorkspaceAccess = (workspaceId, requiredRole = 'member') => {
    if (!state.user?.workspaces) return false
    
    const roleHierarchy = ['viewer', 'member', 'admin', 'owner']
    const userWorkspace = state.user.workspaces.find(ws => 
      ws.workspace._id === workspaceId || ws.workspace === workspaceId
    )
    
    if (!userWorkspace) return false
    
    const userRoleIndex = roleHierarchy.indexOf(userWorkspace.role)
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)
    
    return userRoleIndex >= requiredRoleIndex
  }

  // Get user's role in workspace
  const getWorkspaceRole = (workspaceId) => {
    if (!state.user?.workspaces) return null
    
    const userWorkspace = state.user.workspaces.find(ws => 
      ws.workspace._id === workspaceId || ws.workspace === workspaceId
    )
    
    return userWorkspace?.role || null
  }

  // Get current workspace
  const getCurrentWorkspace = () => {
    if (!state.user?.currentWorkspace) return null
    
    return state.user.workspaces?.find(ws => 
      ws.workspace._id === state.user.currentWorkspace || 
      ws.workspace === state.user.currentWorkspace
    )?.workspace || null
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    switchWorkspace,
    hasWorkspaceAccess,
    getWorkspaceRole,
    getCurrentWorkspace
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}