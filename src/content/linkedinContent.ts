// LinkedIn Content Script - Main Entry Point
// Combines profile data extraction with sidebar mounting

import { toggleSidebar, mountSidebar, isSidebarMounted } from './sidebarMount';
import { extractProfileData } from '@/lib/profileExtractor';

// Re-export for use by sidebar components in same context
export { extractProfileData };

// ============================================================================
// Message Listeners
// ============================================================================

const getChromeRuntime = () => (globalThis as any).chrome?.runtime;

// Listen for messages from popup or background
getChromeRuntime()?.onMessage?.addListener((msg: any, _sender: any, sendResponse: (response: any) => void) => {
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

  return true; // Keep channel open for async response
});

// ============================================================================
// Initialization
// ============================================================================

console.log('[GoGio] LinkedIn content script loaded');
console.log('[GoGio] Current URL:', window.location.href);

// Check if we're on a profile page and auto-mount could be enabled
// For now, sidebar is only shown when explicitly toggled via extension icon
