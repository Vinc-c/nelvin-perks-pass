import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getCurrentUser, signOut, getAssuranceLevel, getMfaPolicy } from '@/api/auth';
import { callRpc } from '@/api/rpc';

// A referral link opened before a Google sign-up is attached afterwards.
function claimPendingReferral(user) {
  let code = null;
  try { code = localStorage.getItem('nelvin_ref'); } catch { return; }
  if (!code || !user) return;
  try { localStorage.removeItem('nelvin_ref'); } catch { /* ignore */ }
  if (user.referred_by || user.referral_code === code) return;
  callRpc('claim_referral', { p_code: code }).catch(() => {});
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrollRequired, setMfaEnrollRequired] = useState(false);
  // Keeps the forced-enrollment screen up until the recovery codes are saved
  // (verifying the new factor triggers an auth refresh that would hide it).
  const [mfaGateHold, setMfaGateHold] = useState(false);
  const loadSeq = useRef(0);

  // `silent` re-checks (auth events) don't flip the global loading state, so
  // the current page stays mounted.
  const checkUserAuth = useCallback(async ({ silent = false } = {}) => {
    const seq = ++loadSeq.current;
    if (!silent) setIsLoadingAuth(true);
    try {
      const currentUser = await getCurrentUser();
      let needsMfa = false;
      let needsEnroll = false;
      if (currentUser) {
        try {
          const aal = await getAssuranceLevel();
          needsMfa = aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
        } catch { /* treat as not required */ }
        if (!needsMfa) {
          // 2FA is mandatory for sensitive roles (super admins, HR by default).
          try {
            const policy = await getMfaPolicy();
            needsEnroll = !!policy?.required && !policy?.has_factor;
          } catch { /* policy unavailable: the database still enforces it */ }
        }
      }
      if (seq !== loadSeq.current) return;
      setMfaRequired(needsMfa);
      setMfaEnrollRequired(needsEnroll);
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setAuthError(null);
      claimPendingReferral(currentUser);
    } catch (error) {
      if (seq !== loadSeq.current) return;
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Authentication failed' });
    } finally {
      if (seq === loadSeq.current) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'MFA_CHALLENGE_VERIFIED') {
        // Defer: Supabase recommends not awaiting other calls inside this callback.
        setTimeout(() => { checkUserAuth({ silent: true }); }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [checkUserAuth]);

  // Silently re-fetch the current user (e.g. after a wallet or profile update)
  // without toggling the global loading state, so the page stays mounted.
  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(!!currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await signOut(shouldRedirect ? '/' : undefined);
  }, []);

  const navigateToLogin = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = '/login?returnTo=' + encodeURIComponent(returnTo);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      passwordRecovery,
      mfaRequired,
      mfaEnrollRequired: mfaEnrollRequired || mfaGateHold,
      setMfaGateHold,
      logout,
      navigateToLogin,
      checkUserAuth,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
