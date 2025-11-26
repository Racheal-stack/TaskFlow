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
  useEffect(() => {
    if (user) {
      let workspace = getCurrentWorkspace()
      
      // If getCurrentWorkspace returns null but user has currentWorkspace ID
      if (!workspace && user.currentWorkspace && user.workspaces) {
        // Find the workspace by ID in the user's workspaces array
        const workspaceData = user.workspaces.find(ws => 
          (ws.workspace._id === user.currentWorkspace || ws.workspace.id === user.currentWorkspace || ws.workspace === user.currentWorkspace)
        )
        workspace = workspaceData?.workspace
      }
      
      console.log('WorkspaceContext: Setting workspace', workspace)
      console.log('WorkspaceContext: User currentWorkspace ID', user.currentWorkspace)
      console.log('WorkspaceContext: User workspaces', user.workspaces)
      
      dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace })
    } else {
      dispatch({ type: 'CLEAR_WORKSPACE' })
    }
  }, [user, getCurrentWorkspace])
  const hasFeature = (feature) => {
    if (!state.currentWorkspace) return false
    const { subscription } = state.currentWorkspace
    if (subscription?.plan === 'pro') {
      return true
    }
    const freeFeatures = [
      'basicTasks',
      'basicProjects', 
      'basicDashboard',
      'basicCollaboration'
    ]
    return freeFeatures.includes(feature)
  }
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
  const getWorkspaceSetting = (setting, defaultValue = null) => {
    return state.currentWorkspace?.settings?.[setting] ?? defaultValue
  }
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