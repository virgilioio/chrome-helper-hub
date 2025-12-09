// LinkedIn Content Script - Main Entry Point
// Combines profile data extraction with sidebar mounting

import { toggleSidebar, mountSidebar, isSidebarMounted, notifySidebarOfUrlChange } from './sidebarMount';
import { extractProfileData } from '@/lib/profileExtractor';

// Re-export for use by sidebar components in same context
export { extractProfileData };

// Track current URL for SPA navigation detection
let currentUrl = window.location.href;

// ============================================================================
// Message Listeners
// ============================================================================

const getChromeRuntime = () => (globalThis as any).chrome?.runtime;

// Listen for messages from popup or background
getChromeRuntime()?.onMessage?.addListener((msg: any, _sender: any, sendResponse: (response: any) => void) => {
  // Respond to PING messages (used by background to check if content script is alive)
  if (msg?.type === 'PING') {
    sendResponse({ ok: true });
    return true;
  }

  // Handle profile data requests (from popup or sidebar)
  if (msg?.type === 'GET_LINKEDIN_PROFILE_DATA') {
    try {
      const data = extractProfileData();
      console.log('[GoGio] Profile data extracted:', {
        hasName: !!data.fullName,
        hasHeadline: !!data.headline,
        hasLocation: !!data.location,
        hasCompany: !!data.currentCompany,
        hasRole: !!data.currentRole,
      });
      sendResponse(data);
    } catch (e) {
      console.warn('[GoGio] Failed to extract LinkedIn profile data', e);
      sendResponse(null);
    }
    return true;
  }

  // Handle sidebar toggle (from background/service worker)
  if (msg?.type === 'TOGGLE_SIDEBAR') {
    console.log('[GoGio][Sidebar] Received TOGGLE_SIDEBAR message');
    toggleSidebar();
    sendResponse({ ok: true, mounted: isSidebarMounted() });
    return true;
  }

  // Handle mount sidebar (explicit mount, don't toggle)
  if (msg?.type === 'MOUNT_SIDEBAR') {
    console.log('[GoGio][Sidebar] Received MOUNT_SIDEBAR message');
    mountSidebar();
    sendResponse({ ok: true, mounted: true });
    return true;
  }

  // Handle URL change notification from background (SPA navigation)
  if (msg?.type === 'URL_CHANGED') {
    console.log('[GoGio] URL changed notification:', msg.url);
    currentUrl = msg.url;
    // Notify sidebar components to refresh data
    notifySidebarOfUrlChange(msg.url);
    sendResponse({ ok: true });
    return true;
  }

  return true; // Keep channel open for async response
});

// ============================================================================
// SPA Navigation Detection (backup for when background doesn't notify)
// ============================================================================

// Monitor for URL changes via History API
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

function handleUrlChange() {
  const newUrl = window.location.href;
  if (newUrl !== currentUrl) {
    console.log('[GoGio] Detected URL change:', currentUrl, '->', newUrl);
    currentUrl = newUrl;
    notifySidebarOfUrlChange(newUrl);
  }
}

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  handleUrlChange();
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  handleUrlChange();
};

// Also listen for popstate (back/forward navigation)
window.addEventListener('popstate', handleUrlChange);

// ============================================================================
// Initialization
// ============================================================================

console.log('[GoGio] LinkedIn content script loaded');
console.log('[GoGio] Current URL:', window.location.href);