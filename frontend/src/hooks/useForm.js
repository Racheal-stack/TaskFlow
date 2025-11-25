import { useState, useCallback } from 'react'

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName]
    if (!rules) return ''

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return ''
  }, [validationRules, values])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validate, validationRules, values])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }, [errors])

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    const error = validate(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [validate])

  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault()
      setIsSubmitting(true)

      // Mark all fields as touched
      const allTouched = {}
      Object.keys(values).forEach(key => {
        allTouched[key] = true
      })
      setTouched(allTouched)

      // Validate all fields
      const isValid = validateAll()
      
      if (isValid) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error('Form submission error:', error)
        }
      }
      
      setIsSubmitting(false)
    }
  }, [values, validateAll])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    validateAll,
    setIsSubmitting
  }
}

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return ''
  },
  
  email: (value) => {
    if (!value) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  },
  
  minLength: (min) => (value) => {
    if (!value) return ''
    if (value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return ''
  },
  
  maxLength: (max) => (value) => {
    if (!value) return ''
    if (value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return ''
  },
  
  password: (value) => {
    if (!value) return ''
    if (value.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    return ''
  },
  
  confirmPassword: (confirmValue, values) => {
    if (!confirmValue) return ''
    if (confirmValue !== values.password) {
      return 'Passwords do not match'
    }
    return ''
  },
  
  url: (value) => {
    if (!value) return ''
    try {
      new URL(value)
      return ''
    } catch {
      return 'Please enter a valid URL'
    }
  }
}