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

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[GoGio][Background] Extension icon clicked', { tabId: tab.id, url: tab.url });

  // If on LinkedIn, toggle the sidebar
  if (isLinkedInPage(tab.url)) {
    console.log('[GoGio][Background] LinkedIn page detected, toggling sidebar');
    
    try {
      // Send message to content script to toggle sidebar
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
      console.log('[GoGio][Background] Toggle response:', response);
    } catch (error) {
      console.error('[GoGio][Background] Failed to toggle sidebar:', error);
      
      // Content script might not be loaded, try injecting it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['linkedin-content.js']
        });
        
        // Try again after injection
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
          } catch (e) {
            console.error('[GoGio][Background] Still failed after injection:', e);
          }
        }, 100);
      } catch (injectError) {
        console.error('[GoGio][Background] Failed to inject content script:', injectError);
      }
    }
  }
  // For non-LinkedIn pages, the popup will be shown via default_popup
  // We handle this by conditionally setting the popup below
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
