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
    const urlObj = new URL(url);
    const hash = urlObj.hash;
    
    if (!hash || hash.length <= 1) {
      return null;
    }
    
    // Parse the fragment as URL params (remove leading #)
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('token');
    
    return token || null;
  } catch {
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
        // Check for Chrome runtime errors (e.g., user cancelled)
        const lastError = (globalThis as any).chrome?.runtime?.lastError;
        if (lastError) {
          reject(new Error(lastError.message || 'OAuth flow was cancelled or failed.'));
          return;
        }

        // Check if we got a redirect URL
        if (!redirectUrl) {
          reject(new Error('OAuth flow was cancelled. Please try again.'));
          return;
        }

        // Parse the token from the URL fragment
        const token = parseTokenFromUrl(redirectUrl);
        
        if (!token) {
          reject(new Error('No token received from GoGio. Please try again.'));
          return;
        }

        resolve(token);
      }
    );
  });
}
