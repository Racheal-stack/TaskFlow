import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'
import ThemeToggle from '../../components/common/ThemeToggle'
import { authAPI } from '../../services/api'
const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  useEffect(() => {
    if (location.state?.showVerification && location.state?.email) {
      setShowVerification(true)
      setUserEmail(location.state.email)
      toast.info('Please verify your email address to continue')
    }
  }, [location])
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!formData.companyName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      const response = await authAPI.register({
        name: formData.companyName, // Use company name as user name
        email: formData.email,
        password: formData.password,
        workspaceName: formData.companyName // Backend still expects workspaceName
      })
      setUserEmail(formData.email)
      setShowVerification(true)
      toast.success('Registration successful! Please check your email for verification code.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }
  const handleVerification = async (e) => {
    e.preventDefault()
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code')
      return
    }
    setIsLoading(true)
    try {
      await authAPI.verifyEmail({
        email: userEmail,
        verificationCode
      })
      toast.success('Email verified successfully! You can now log in.')
      navigate('/login', { 
        state: { fromVerification: true }
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }
  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await authAPI.resendVerificationCode({ email: userEmail })
      toast.success('Verification code sent to your email')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }
  if (showVerification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <Link to="/" className="block mb-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">TaskFlow</div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verify Your Email</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              We've sent a 6-digit verification code to <span className="font-medium">{userEmail}</span>
            </p>
            {location.state?.fromLogin && (
              <p className="text-purple-600 dark:text-purple-400 text-xs">
                After verification, you'll be able to log in to your account.
              </p>
            )}
          </div>
          <form onSubmit={handleVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl font-mono"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
              Verify Email
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm font-medium disabled:opacity-50"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
        <Link to="/" className="flex justify-center mb-6">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">TaskFlow</div>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Create your account</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Acme Inc, My Company"
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your workspace will be created with this name
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email address"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Create a password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
export default RegisterPage