import { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext()

const workspaceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_WORKSPACE':
      return {
        ...state,
        currentWorkspace: action.payload,
        isLoading: false
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        currentWorkspace: state.currentWorkspace?.id === action.payload.id 
          ? { ...state.currentWorkspace, ...action.payload }
          : state.currentWorkspace
      }
    case 'CLEAR_WORKSPACE':
      return {
        ...state,
        currentWorkspace: null,
        isLoading: false
      }
    default:
      return state
  }
}

const initialState = {
  currentWorkspace: null,
  isLoading: true
}

export const WorkspaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState)
  const { user, getCurrentWorkspace } = useAuth()

  // Set current workspace based on user data
  useEffect(() => {
    if (user) {
      const workspace = getCurrentWorkspace()
      dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace })
    } else {
      dispatch({ type: 'CLEAR_WORKSPACE' })
    }
  }, [user, getCurrentWorkspace])

  // Check if workspace has feature
  const hasFeature = (feature) => {
    if (!state.currentWorkspace) return false
    
    const { subscription } = state.currentWorkspace
    
    if (subscription?.plan === 'pro') {
      return true
    }
    
    // Free plan features
    const freeFeatures = [
      'basicTasks',
      'basicProjects', 
      'basicDashboard',
      'basicCollaboration'
    ]
    
    return freeFeatures.includes(feature)
  }

  // Check usage limits
  const checkUsageLimit = (type) => {
    if (!state.currentWorkspace) return { allowed: false, used: 0, limit: 0 }
    
    const { limits, usage, subscription } = state.currentWorkspace
    
    if (subscription?.plan === 'pro') {
      return { allowed: true, used: usage[type] || 0, limit: 'Unlimited' }
    }
    
    const used = usage[type] || 0
    const limit = limits[type] || 0
    
    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used)
    }
  }

  // Get workspace settings
  const getWorkspaceSetting = (setting, defaultValue = null) => {
    return state.currentWorkspace?.settings?.[setting] ?? defaultValue
  }

  // Update workspace function
  const updateWorkspace = (workspaceData) => {
    dispatch({ type: 'UPDATE_WORKSPACE', payload: workspaceData })
  }

  const value = {
    ...state,
    hasFeature,
    checkUsageLimit,
    getWorkspaceSetting,
    updateWorkspace
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}