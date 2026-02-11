// GoGio Background Service Worker
// Handles extension icon clicks, OAuth, API proxy, and coordinates between popup and content scripts

console.log('[GoGio][Background] Service worker started');

const OAUTH_START_URL = 'https://app.gogio.io/chrome-oauth/start';
const GATEWAY_URL = 'https://aba41743-9dfe-4b0e-88f2-0c24aeb910c4.functions.supabase.co/chrome-api-gateway';

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

        // path now contains the full query string like "chrome-api-gateway?action=me"
        const fullUrl = `${GATEWAY_URL}?${path.includes('?') ? path.split('?')[1] : path}`;
        console.log('[GoGio][Background] Fetching URL:', fullUrl);

        const res = await fetch(fullUrl, {
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

        if (!res.ok) {
          console.error('[GoGio][Background] API error:', res.status, text);
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

  // Read downloaded file and return base64 data
  if (message.type === 'READ_DOWNLOADED_FILE') {
    const { downloadId } = message;
    console.log('[GoGio][Background] READ_DOWNLOADED_FILE:', downloadId);

    (async () => {
      try {
        // Get download item details
        const [item] = await chrome.downloads.search({ id: downloadId });
        if (!item) {
          sendResponse({ success: false, error: 'Download not found' });
          return;
        }

        const { filename: filePath, filename: fullPath } = item;
        const basename = fullPath.split(/[\\/]/).pop() || 'resume.pdf';

        // Read the file using fetch with file:// URL
        // Note: This requires the downloads permission
        const fileUrl = `file://${filePath}`;
        
        try {
          const response = await fetch(fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          
          // Convert ArrayBuffer to base64
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          
          console.log('[GoGio][Background] File read successfully, size:', uint8Array.length);
          sendResponse({ 
            success: true, 
            data: base64, 
            filename: basename,
            size: uint8Array.length 
          });
        } catch (fetchError) {
          console.error('[GoGio][Background] Failed to read file via fetch:', fetchError);
          sendResponse({ success: false, error: 'Cannot read file. File may have been moved or deleted.' });
        }
      } catch (error) {
        console.error('[GoGio][Background] READ_DOWNLOADED_FILE failed:', error);
        sendResponse({ success: false, error: error?.message || 'Failed to read file' });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (message.type === 'START_OAUTH') {
    console.log('[GoGio][Background] Starting OAuth flow...');
    
    const redirectUri = chrome.identity.getRedirectURL('provider_cb');
    const oauthUrl = `${OAUTH_START_URL}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('[GoGio][Background] Using redirect URI:', redirectUri);

    chrome.identity.launchWebAuthFlow(
      {
        url: oauthUrl,
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

  // Retry PING after a short delay — manifest injection may still be initializing
  console.log('[GoGio][Background] Content script not ready, retrying PING in 300ms...');
  await new Promise(resolve => setTimeout(resolve, 300));
  const isReadyRetry = await isContentScriptReady(tabId);
  if (isReadyRetry) {
    console.log('[GoGio][Background] Content script ready on retry');
    return true;
  }

  // Last resort: inject the content script (the script itself has a duplicate guard)
  console.log('[GoGio][Background] Injecting content script...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['linkedin-content.js']
    });
    
    // Wait a bit for it to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify it's ready now
    const readyAfterInject = await isContentScriptReady(tabId);
    console.log('[GoGio][Background] Content script ready after injection:', readyAfterInject);
    return readyAfterInject;
  } catch (error) {
    console.error('[GoGio][Background] Failed to inject content script:', error);
    return false;
  }
}

// Handle extension icon click - always fires since no default_popup
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[GoGio][Background] Extension icon clicked', { tabId: tab.id, url: tab.url });

  if (isLinkedInPage(tab.url)) {
    // LinkedIn: toggle sidebar
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
  } else {
    // Non-LinkedIn: open popup manually
    console.log('[GoGio][Background] Non-LinkedIn page, opening popup');
    try {
      await chrome.action.openPopup();
    } catch (error) {
      // Fallback: open as new tab if openPopup fails (requires Chrome 99+)
      console.log('[GoGio][Background] openPopup failed, opening as tab:', error.message);
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
  }
});

// Listen for SPA navigation (LinkedIn uses History API)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  // Only handle main frame navigation
  if (details.frameId !== 0) return;
  
  console.log('[GoGio][Background] SPA navigation detected:', details.url);
  
  if (isLinkedInPage(details.url)) {
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

// ============================================================================
// LinkedIn PDF Resume Detection
// ============================================================================

const LINKEDIN_HOSTS = ['www.linkedin.com', 'linkedin.com'];
const LINKEDIN_CDN_HOSTS = ['media.licdn.com'];

function isLinkedInDownloadUrl(urlString) {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    const host = url.hostname;
    return (
      LINKEDIN_HOSTS.includes(host) ||
      LINKEDIN_CDN_HOSTS.includes(host) ||
      host.endsWith('.linkedin.com') ||
      host.endsWith('.licdn.com')
    );
  } catch {
    return false;
  }
}

function isPdfFilename(filename) {
  if (!filename) return false;
  return filename.toLowerCase().endsWith('.pdf');
}

function isPdfMimeType(mime) {
  if (!mime) return false;
  return mime.toLowerCase() === 'application/pdf';
}

// Listen for completed downloads
chrome.downloads.onChanged.addListener(async (delta) => {
  try {
    // Only care about completed downloads
    if (delta.state?.current !== 'complete') return;

    // Get download details
    const [item] = await chrome.downloads.search({ id: delta.id });
    if (!item) return;

    const { id, filename, mime, url, referrer, tabId } = item;

    // Only care about PDFs
    if (!isPdfFilename(filename) && !isPdfMimeType(mime)) {
      return;
    }

    // Check LinkedIn origins (download URL OR referrer)
    let isLinkedin = isLinkedInDownloadUrl(url) || isLinkedInDownloadUrl(referrer);

    // Also check the tab URL if we have a tabId
    let finalTabId = tabId;
    if (!isLinkedin && typeof tabId === 'number' && tabId > 0) {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab?.url && isLinkedInDownloadUrl(tab.url)) {
          isLinkedin = true;
        }
      } catch {
        // Tab might be closed, ignore
      }
    }

    if (!isLinkedin) {
      console.log('[GoGio][Downloads] Ignoring non-LinkedIn PDF:', filename);
      return;
    }

    // LinkedIn PDF detected!
    console.log('[GoGio][Downloads] LinkedIn PDF detected:', {
      id,
      filename,
      url,
      referrer,
      tabId: finalTabId,
    });

    // Notify the content script on the originating tab
    if (typeof finalTabId === 'number' && finalTabId > 0) {
      try {
        await chrome.tabs.sendMessage(finalTabId, {
          type: 'LINKEDIN_RESUME_DOWNLOADED',
          downloadId: id,
          filename,
          url,
        });
        console.log('[GoGio][Downloads] Notified content script of resume download');
      } catch (error) {
        console.log('[GoGio][Downloads] Could not notify content script:', error.message);
      }
    }
  } catch (error) {
    console.error('[GoGio][Downloads] Error handling download:', error);
  }
});