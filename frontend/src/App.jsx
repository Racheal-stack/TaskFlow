import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import InvitationPage from './pages/InvitationPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import TasksPage from './pages/tasks/TasksPage'
import TrackingPage from './pages/TrackingPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/settings/SettingsPage'
import PricingPage from './pages/PricingPage'
import NotFoundPage from './pages/NotFoundPage'
function App() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Routes>
        {}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password/:token" element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } />
        <Route path="/invite/:token" element={<InvitationPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        {}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <SocketProvider>
              <DashboardPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <SocketProvider>
              <ProjectsPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId" element={
          <ProtectedRoute>
            <SocketProvider>
              <ProjectDetailPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <SocketProvider>
              <TasksPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute>
            <SocketProvider>
              <TrackingPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <SocketProvider>
              <CalendarPage />
            </SocketProvider>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings/:section" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        {}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
export default App