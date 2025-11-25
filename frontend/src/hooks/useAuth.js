import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useAuthHooks = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { login: authLogin, logout: authLogout } = useAuth()

  const login = async (credentials) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authAPI.login(credentials)
      authLogin(response.user, response.token)
      toast.success('Welcome back!')
      return response
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authAPI.register(userData)
      authLogin(response.user, response.token)
      toast.success('Account created successfully!')
      return response
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authAPI.logout()
      authLogout()
      toast.success('Logged out successfully')
    } catch (err) {
      // Still logout locally even if server request fails
      authLogout()
      console.error('Logout error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profileData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authAPI.updateProfile(profileData)
      toast.success('Profile updated successfully')
      return response
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async (passwordData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authAPI.changePassword(passwordData)
      toast.success('Password changed successfully')
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authAPI.forgotPassword(email)
      toast.success('Password reset email sent')
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (token, password) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authAPI.resetPassword(token, password)
      toast.success('Password reset successfully')
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    isLoading,
    error,
    setError
  }
}