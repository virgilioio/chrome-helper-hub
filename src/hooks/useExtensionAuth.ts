import { useState, useEffect, useCallback } from 'react';
import { getToken, setToken as storeToken, clearToken as removeToken } from '@/lib/chromeStorage';
import { apiClient, UserInfo } from '@/lib/api';
import { startChromeOAuthFlow } from '@/lib/oauth';
import { isContentScriptContext, startOAuthViaBridge } from '@/lib/oauthBridge';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'error';

export interface UseExtensionAuthReturn {
  status: AuthStatus;
  user: UserInfo | null;
  error: string | null;
  token: string | null;
  setToken: (token: string) => Promise<boolean>;
  clearToken: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  loginWithOAuth: () => Promise<boolean>;
}

export function useExtensionAuth(): UseExtensionAuthReturn {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  const checkAuth = useCallback(async (authToken: string) => {
    try {
      apiClient.setToken(authToken);
      const userInfo = await apiClient.getMe();
      setUser(userInfo);
      setStatus('authenticated');
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage === 'UNAUTHORIZED') {
        setError('Invalid or expired token');
        setStatus('error');
      } else {
        setError(errorMessage);
        setStatus('error');
      }
      apiClient.clearToken();
      return false;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setStatus('loading');
    setError(null); // Clear any previous error on refresh
    const storedToken = await getToken();
    
    if (!storedToken) {
      setStatus('unauthenticated');
      setTokenState(null);
      return;
    }

    // Try to validate the stored token silently
    try {
      apiClient.setToken(storedToken);
      const userInfo = await apiClient.getMe();
      setUser(userInfo);
      setTokenState(storedToken);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      // Token is invalid/expired - silently clear it and show unauthenticated state
      // NO error message shown - user hasn't explicitly tried to connect yet
      console.log('[Auth] Stored token invalid, clearing silently');
      await removeToken();
      apiClient.clearToken();
      setTokenState(null);
      setUser(null);
      setStatus('unauthenticated'); // NOT 'error' - keeps UI neutral
    }
  }, []);

  const handleSetToken = useCallback(async (newToken: string): Promise<boolean> => {
    setStatus('loading');
    const isValid = await checkAuth(newToken);
    
    if (isValid) {
      await storeToken(newToken);
      setTokenState(newToken);
    }
    
    return isValid;
  }, [checkAuth]);

  const handleClearToken = useCallback(async () => {
    await removeToken();
    apiClient.clearToken();
    setTokenState(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  const loginWithOAuth = useCallback(async (): Promise<boolean> => {
    console.log('[Auth] Starting OAuth login flow');
    setStatus('loading');
    setError(null);

    try {
      // Detect context and use appropriate OAuth method
      const inContentScript = isContentScriptContext();
      console.log('[Auth] Context detection - Content script:', inContentScript);
      
      // Start OAuth flow and get token
      let oauthToken: string;
      if (inContentScript) {
        console.log('[Auth] Using OAuth bridge for content script...');
        oauthToken = await startOAuthViaBridge();
      } else {
        console.log('[Auth] Calling startChromeOAuthFlow directly...');
        oauthToken = await startChromeOAuthFlow();
      }
      console.log('[Auth] Got token from OAuth, length:', oauthToken.length);
      
      // Validate the token with the API
      console.log('[Auth] Setting token on apiClient...');
      apiClient.setToken(oauthToken);
      
      console.log('[Auth] Calling getMe() to validate token...');
      const userInfo = await apiClient.getMe();
      console.log('[Auth] getMe() succeeded, user:', userInfo.email);
      
      // Save the token and update state
      await storeToken(oauthToken);
      setTokenState(oauthToken);
      setUser(userInfo);
      setStatus('authenticated');
      setError(null);
      
      console.log('[Auth] OAuth login complete, authenticated');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not connect to GoGio. Please try again.';
      console.error('[Auth] OAuth login failed:', errorMessage);
      
      // Clear any partial state
      await removeToken();
      apiClient.clearToken();
      setTokenState(null);
      setUser(null);
      setStatus('error');
      setError(errorMessage);
      
      return false;
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return {
    status,
    user,
    error,
    token,
    setToken: handleSetToken,
    clearToken: handleClearToken,
    refreshAuth,
    loginWithOAuth,
  };
}
