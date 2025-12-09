// OAuth bridge for content scripts
// Content scripts cannot use chrome.identity directly, so we message the background script

interface OAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Check if we're running in a content script context (not in extension popup/background)
 */
export function isContentScriptContext(): boolean {
  // In content scripts, chrome.identity is not available
  const chrome = (globalThis as any).chrome;
  return chrome && 
         chrome.runtime && 
         typeof chrome.runtime.sendMessage === 'function' &&
         typeof chrome.identity?.launchWebAuthFlow !== 'function';
}

/**
 * Start OAuth flow via background script message passing
 * Used when running in content script context
 */
export async function startOAuthViaBridge(): Promise<string> {
  const chrome = (globalThis as any).chrome;
  
  if (!chrome?.runtime?.sendMessage) {
    throw new Error('Chrome runtime API is not available.');
  }

  console.log('[OAuth Bridge] Sending START_OAUTH message to background script');
  
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'START_OAUTH' }, (response: OAuthResponse) => {
      // Check for runtime errors
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        console.error('[OAuth Bridge] Runtime error:', lastError.message);
        reject(new Error(lastError.message || 'Failed to communicate with extension.'));
        return;
      }

      if (!response) {
        console.error('[OAuth Bridge] No response received');
        reject(new Error('No response from extension. Please try again.'));
        return;
      }

      if (response.success && response.token) {
        console.log('[OAuth Bridge] OAuth successful');
        resolve(response.token);
      } else {
        console.error('[OAuth Bridge] OAuth failed:', response.error);
        reject(new Error(response.error || 'OAuth failed. Please try again.'));
      }
    });
  });
}
