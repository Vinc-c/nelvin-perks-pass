import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import MfaChallenge from '@/components/MfaChallenge';
import MfaEnrollGate from '@/components/MfaEnrollGate';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth, mfaRequired, mfaEnrollRequired } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (!authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (mfaRequired) {
    return <MfaChallenge />;
  }

  if (mfaEnrollRequired) {
    return <MfaEnrollGate />;
  }

  return <Outlet />;
}
