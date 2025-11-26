import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceInvitationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workspaceInvitationAPI.getInvitationByToken(token);
      setInvitation(response.data);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError(err.response?.data?.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with invitation token
      navigate(`/login?invite=${token}`);
      return;
    }

    try {
      setProcessing(true);
      const response = await workspaceInvitationAPI.acceptInvitation(token);
      toast.success(response.message || 'Invitation accepted!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload(); // Reload to update workspace context
      }, 1500);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      toast.error('Please login to decline this invitation');
      navigate(`/login?invite=${token}`);
      return;
    }

    try {
      setProcessing(true);
      await workspaceInvitationAPI.declineInvitation(token);
      toast.success('Invitation declined');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            You're Invited!
          </h1>
          <p className="text-purple-100">
            Join your team on TaskFlow
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Workspace Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {invitation?.workspace?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Workspace
                </p>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invited to</p>
                <p className="font-medium">{invitation?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <UserPlus className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invited by</p>
                <p className="font-medium">{invitation?.invitedBy?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your role</p>
                <p className="font-medium capitalize">{invitation?.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expires</p>
                <p className="font-medium">
                  {new Date(invitation?.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!user && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please login or create an account to accept this invitation.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={processing}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {processing ? 'Processing...' : user ? 'Accept & Join' : 'Login to Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationPage;
