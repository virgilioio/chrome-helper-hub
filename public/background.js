// GoGio Background Service Worker
// Handles extension icon clicks and coordinates between popup and content scripts

console.log('[GoGio][Background] Service worker started');

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
