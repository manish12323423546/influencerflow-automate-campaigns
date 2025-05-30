
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const CreatorDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Creator Dashboard - Auth state:', { user: !!user, userRole, loading });
    
    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      if (userRole === 'brand') {
        console.log('Brand detected, redirecting to brand dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }

      if (!userRole) {
        console.log('No role found for creator dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-snow">Loading creator dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-carbon p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold text-snow mb-2">
            Creator Dashboard
          </h1>
          <p className="text-snow/70">
            Welcome back! Track your campaigns and earnings.
          </p>
        </div>
        
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-snow mb-4">
            Welcome to your Creator Dashboard
          </h2>
          <p className="text-snow/70">
            Your creator dashboard is ready! View your campaigns and track your performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
