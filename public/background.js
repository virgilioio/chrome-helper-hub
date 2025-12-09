// GoGio Background Service Worker
// Handles extension icon clicks, OAuth, API proxy, and coordinates between popup and content scripts

console.log('[GoGio][Background] Service worker started');

const OAUTH_START_URL = 'https://app.gogio.io/chrome-oauth/start';
const API_BASE_URL = 'https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1';

// Parse token from OAuth redirect URL
function parseTokenFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash;
    if (!hash || hash.length <= 1) return null;
    const params = new URLSearchParams(hash.substring(1));
    return params.get('token') || null;
  } catch (err) {
    console.error('[GoGio][Background] Error parsing redirect URL:', err);
    return null;
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[GoGio][Background] Received message:', message.type);

  // Respond to PING messages (used to check if content script is alive)
  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return true;
  }

  // API Proxy for content scripts (avoids CORS issues)
  if (message.type === 'API_REQUEST') {
    const { path, method = 'GET', body, token } = message;
    console.log('[GoGio][Background] API_REQUEST:', method, path);

    (async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        console.log('[GoGio][Background] API_REQUEST response:', res.status, 'for', path);

        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        sendResponse({
          ok: res.ok,
          status: res.status,
          data,
        });
      } catch (error) {
        console.error('[GoGio][Background] API_REQUEST failed:', error);
        sendResponse({
          ok: false,
          status: 0,
          error: error?.message || 'API request failed',
        });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (message.type === 'START_OAUTH') {
    console.log('[GoGio][Background] Starting OAuth flow...');
    
    chrome.identity.launchWebAuthFlow(
      {
        url: OAUTH_START_URL,
        interactive: true,
      },
      (redirectUrl) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          console.error('[GoGio][Background] OAuth error:', lastError.message);
          sendResponse({ success: false, error: lastError.message || 'OAuth flow was cancelled or failed.' });
          return;
        }

        if (!redirectUrl) {
          console.error('[GoGio][Background] No redirect URL received');
          sendResponse({ success: false, error: 'OAuth flow was cancelled. Please try again.' });
          return;
        }

        console.log('[GoGio][Background] OAuth redirect received');
        const token = parseTokenFromUrl(redirectUrl);
        
        if (!token) {
          console.error('[GoGio][Background] Failed to parse token');
          sendResponse({ success: false, error: 'No token received from GoGio. Please try again.' });
          return;
        }

        console.log('[GoGio][Background] OAuth successful, token received');
        sendResponse({ success: true, token });
      }
    );
    
    return true; // Keep channel open for async response
  }
});

// Check if a URL is a LinkedIn page
function isLinkedInPage(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

// Check if content script is ready by sending a PING
async function isContentScriptReady(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return response?.ok === true;
  } catch {
    return false;
  }
}

// Ensure content script is loaded and ready
async function ensureContentScriptReady(tabId) {
  // First check if it's already ready
  const isReady = await isContentScriptReady(tabId);
  if (isReady) {
    console.log('[GoGio][Background] Content script already ready');
    return true;
  }

  // Try to inject the content script
  console.log('[GoGio][Background] Injecting content script...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['linkedin-content.js']
    });
    
    // Wait a bit for it to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify it's ready now
    const readyAfterInject = await isContentScriptReady(tabId);
    console.log('[GoGio][Background] Content script ready after injection:', readyAfterInject);
    return readyAfterInject;
  } catch (error) {
    console.error('[GoGio][Background] Failed to inject content script:', error);
    return false;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[GoGio][Background] Extension icon clicked', { tabId: tab.id, url: tab.url });

  // If on LinkedIn, toggle the sidebar
  if (isLinkedInPage(tab.url)) {
    console.log('[GoGio][Background] LinkedIn page detected, toggling sidebar');
    
    const ready = await ensureContentScriptReady(tab.id);
    if (ready) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
        console.log('[GoGio][Background] Toggle response:', response);
      } catch (error) {
        console.error('[GoGio][Background] Failed to toggle sidebar:', error);
      }
    } else {
      console.error('[GoGio][Background] Content script not ready, cannot toggle sidebar');
    }
  }
  // For non-LinkedIn pages, the popup will be shown via default_popup
});

// Dynamically set popup based on current tab
async function updatePopupForTab(tabId, url) {
  if (isLinkedInPage(url)) {
    // No popup on LinkedIn - icon click triggers sidebar
    await chrome.action.setPopup({ tabId, popup: '' });
  } else {
    // Show popup on non-LinkedIn pages
    await chrome.action.setPopup({ tabId, popup: 'index.html' });
  }
}

// Listen for tab updates to adjust popup behavior
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updatePopupForTab(tabId, tab.url);
  }
});

// Listen for SPA navigation (LinkedIn uses History API)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  // Only handle main frame navigation
  if (details.frameId !== 0) return;
  
  console.log('[GoGio][Background] SPA navigation detected:', details.url);
  
  if (isLinkedInPage(details.url)) {
    // Update popup state
    await updatePopupForTab(details.tabId, details.url);
    
    // Notify content script of URL change so it can update autofill
    try {
      await chrome.tabs.sendMessage(details.tabId, { 
        type: 'URL_CHANGED', 
        url: details.url 
      });
    } catch (error) {
      // Content script might not be ready yet, that's ok
      console.log('[GoGio][Background] Could not notify content script of URL change');
    }
  }
}, { url: [{ hostContains: 'linkedin.com' }] });

// Listen for tab activation to adjust popup behavior
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      updatePopupForTab(activeInfo.tabId, tab.url);
    }
  } catch (error) {
    console.error('[GoGio][Background] Failed to get tab:', error);
  }
});

// Initialize popup state for existing tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    if (tab.id && tab.url) {
      updatePopupForTab(tab.id, tab.url);
    }
  });
});