import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, User, Mail, Lock, Briefcase } from 'lucide-react'
import { useForm, validationRules } from '../hooks/useForm'
import { useAuthHooks } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/common/ThemeToggle'

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuthHooks()
  const { theme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      workspaceName: '',
      acceptTerms: false
    },
    {
      firstName: [validationRules.required, validationRules.minLength(2)],
      lastName: [validationRules.required, validationRules.minLength(2)],
      email: [validationRules.required, validationRules.email],
      password: [validationRules.required, validationRules.password],
      confirmPassword: [validationRules.required, validationRules.confirmPassword],
      workspaceName: [validationRules.required, validationRules.minLength(2)],
      acceptTerms: [(value) => !value ? 'You must accept the terms and conditions' : '']
    }
  )

  const onSubmit = async (formData) => {
    try {
      // Combine first and last name for backend API
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      
      await register({
        name: fullName,
        email: formData.email,
        password: formData.password,
        workspaceName: formData.workspaceName
      })
      
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  const passwordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^\w\s]/.test(password)) strength++
    return strength
  }

  const getStrengthColor = (strength) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength) => {
    if (strength < 2) return 'Weak'
    if (strength < 4) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-md">
            <ThemeToggle />
            <div className="text-xs mt-1 text-gray-600 dark:text-gray-300 text-center">
              {theme}
            </div>
          </div>
        </div>

        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">TaskFlow</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join thousands of teams already using TaskFlow
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 transition-colors">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.firstName && touched.firstName
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="John"
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.firstName && touched.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.lastName && touched.lastName
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Doe"
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.lastName && touched.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.email && touched.email
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="john@company.com"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Workspace Name */}
            <div>
              <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workspace Name
              </label>
              <div className="mt-1 relative">
                <input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  required
                  value={values.workspaceName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.workspaceName && touched.workspaceName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="My Company"
                />
                <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.workspaceName && touched.workspaceName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.workspaceName}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 pl-10 pr-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.password && touched.password
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {values.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength(values.password) < 2 ? 'text-red-600 dark:text-red-400' :
                      passwordStrength(values.password) < 4 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {getStrengthText(passwordStrength(values.password))}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength(values.password))}`}
                      style={{ width: `${(passwordStrength(values.password) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 pl-10 pr-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div>
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={values.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && touched.acceptTerms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-gray-800"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why teams choose TaskFlow
          </h3>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Easy Setup</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get started in minutes with our intuitive setup process
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Team Collaboration</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Work seamlessly with your team in real-time
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise Ready</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Scalable solution that grows with your business
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage