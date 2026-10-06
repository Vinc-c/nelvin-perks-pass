import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getCurrentUser, signOut } from '@/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const loadSeq = useRef(0);

  // `silent` re-checks (auth events) don't flip the global loading state, so
  // the current page stays mounted.
  const checkUserAuth = useCallback(async ({ silent = false } = {}) => {
    const seq = ++loadSeq.current;
    if (!silent) setIsLoadingAuth(true);
    try {
      const currentUser = await getCurrentUser();
      if (seq !== loadSeq.current) return;
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setAuthError(null);
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
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
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
