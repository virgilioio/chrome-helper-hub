// Chrome OAuth helper for GoGio extension

const OAUTH_START_URL = 'https://app.gogio.io/chrome-oauth/start';

/**
 * Check if Chrome identity API is available
 */
const isChromeIdentityAvailable = (): boolean => {
  return typeof globalThis !== 'undefined' && 
         'chrome' in globalThis && 
         typeof (globalThis as any).chrome?.identity?.launchWebAuthFlow === 'function';
};

/**
 * Get the Chrome identity API
 */
const getChromeIdentity = () => (globalThis as any).chrome?.identity;

/**
 * Parse the token from the redirect URL fragment
 * Expected format: https://...chromiumapp.org/provider_cb#token=<ACCESS_TOKEN>
 */
const parseTokenFromUrl = (url: string): string | null => {
  try {
    console.log('[OAuth] Parsing redirect URL:', url);
    
    const urlObj = new URL(url);
    const hash = urlObj.hash;
    
    console.log('[OAuth] URL hash:', hash ? `"${hash.substring(0, 20)}..."` : 'empty');
    
    if (!hash || hash.length <= 1) {
      console.log('[OAuth] No hash fragment found in URL');
      return null;
    }
    
    // Parse the fragment as URL params (remove leading #)
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('token');
    
    if (token) {
      const masked = token.length > 12 
        ? `${token.slice(0, 8)}...${token.slice(-4)}` 
        : '[short token]';
      console.log('[OAuth] Token found:', masked, 'length:', token.length);
    } else {
      console.log('[OAuth] No "token" param in hash fragment');
      // Log all params for debugging
      const allParams = Array.from(params.keys());
      console.log('[OAuth] Available params in hash:', allParams);
    }
    
    return token || null;
  } catch (err) {
    console.error('[OAuth] Error parsing redirect URL:', err);
    return null;
  }
};

/**
 * Start the Chrome OAuth flow to authenticate with GoGio
 * @returns Promise<string> - The access token
 * @throws Error if OAuth fails, is cancelled, or no token is returned
 */
export async function startChromeOAuthFlow(): Promise<string> {
  if (!isChromeIdentityAvailable()) {
    throw new Error('Chrome identity API is not available. Run this code as a Chrome extension.');
  }

  const identity = getChromeIdentity();

  return new Promise((resolve, reject) => {
    identity.launchWebAuthFlow(
      {
        url: OAUTH_START_URL,
        interactive: true,
      },
      (redirectUrl: string | undefined) => {
        console.log('[OAuth] launchWebAuthFlow callback triggered');
        
        // Check for Chrome runtime errors (e.g., user cancelled)
        const lastError = (globalThis as any).chrome?.runtime?.lastError;
        if (lastError) {
          console.error('[OAuth] Chrome runtime error:', lastError.message);
          reject(new Error(lastError.message || 'OAuth flow was cancelled or failed.'));
          return;
        }

        // Check if we got a redirect URL
        if (!redirectUrl) {
          console.error('[OAuth] No redirect URL received');
          reject(new Error('OAuth flow was cancelled. Please try again.'));
          return;
        }

        console.log('[OAuth] Redirect URL received:', redirectUrl.substring(0, 60) + '...');

        // Parse the token from the URL fragment
        const token = parseTokenFromUrl(redirectUrl);
        
        if (!token) {
          console.error('[OAuth] Failed to parse token from redirect URL');
          reject(new Error('No token received from GoGio. Please try again.'));
          return;
        }

        console.log('[OAuth] Successfully extracted token, resolving promise');
        resolve(token);
      }
    );
  });
}
