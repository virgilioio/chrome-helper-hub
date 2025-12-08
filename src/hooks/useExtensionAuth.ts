import { useState, useEffect, useCallback } from 'react';
import { getToken, setToken as storeToken, clearToken as removeToken } from '@/lib/chromeStorage';
import { apiClient, UserInfo } from '@/lib/api';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'error';

export interface UseExtensionAuthReturn {
  status: AuthStatus;
  user: UserInfo | null;
  error: string | null;
  token: string | null;
  setToken: (token: string) => Promise<boolean>;
  clearToken: () => Promise<void>;
  refreshAuth: () => Promise<void>;
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
    const storedToken = await getToken();
    
    if (!storedToken) {
      setStatus('unauthenticated');
      setTokenState(null);
      return;
    }

    setTokenState(storedToken);
    await checkAuth(storedToken);
  }, [checkAuth]);

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
  };
}
