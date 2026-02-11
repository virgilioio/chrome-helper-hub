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
  const hasRuntime = !!chrome?.runtime;
  const hasSendMessage = typeof chrome?.runtime?.sendMessage === 'function';
  const hasIdentity = typeof chrome?.identity?.launchWebAuthFlow === 'function';
  const result = hasRuntime && hasSendMessage && !hasIdentity;
  console.log('[Debug] isContentScriptContext:', result, { hasRuntime, hasSendMessage, hasIdentity });
  return result;
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
    // OAuth can take a while - user needs to complete login in popup
    // No timeout here - we wait for user action
    
    chrome.runtime.sendMessage({ type: 'START_OAUTH' }, (response: OAuthResponse) => {
      // Check for runtime errors
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        console.error('[OAuth Bridge] Runtime error:', lastError.message);
        // Check if this is a user cancellation
        const message = lastError.message || '';
        if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('closed')) {
          reject(new Error('User cancelled authentication.'));
        } else {
          reject(new Error(message || 'Failed to communicate with extension.'));
        }
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
        // Parse error for user-friendly message
        const errorMsg = response.error || 'OAuth failed. Please try again.';
        
        // Check for user cancellation patterns
        if (errorMsg.toLowerCase().includes('cancel') || 
            errorMsg.toLowerCase().includes('closed') ||
            errorMsg.toLowerCase().includes('denied')) {
          reject(new Error('User cancelled authentication.'));
        } else {
          reject(new Error(errorMsg));
        }
      }
    });
  });
}
