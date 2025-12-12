import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CandidatePanelApp } from './CandidatePanelApp';
import { GoGioLogo } from './GoGioLogo';
import { Toaster, toast } from '@/components/ui/sonner';
import { URL_CHANGE_EVENT } from '@/content/sidebarMount';
import { useLinkedInResumeDetection } from '@/hooks/useLinkedInResumeDetection';

// Get the avatar URL - works in both popup and content script contexts
const getAvatarUrl = (): string => {
  const chrome = (globalThis as any).chrome;
  if (chrome?.runtime?.getURL) {
    return chrome.runtime.getURL('gio-avatar.png');
  }
  // Fallback for development
  return '/gio-avatar.png';
};

// Chrome storage helpers for sidebar state
const getSidebarCollapsed = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const chrome = (globalThis as any).chrome;
    if (!chrome?.storage?.local) {
      resolve(false);
      return;
    }
    chrome.storage.local.get(['gogio_sidebar_collapsed'], (result: any) => {
      resolve(result?.gogio_sidebar_collapsed ?? false);
    });
  });
};

const setSidebarCollapsed = (collapsed: boolean): Promise<void> => {
  return new Promise((resolve) => {
    const chrome = (globalThis as any).chrome;
    if (!chrome?.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.set({ gogio_sidebar_collapsed: collapsed }, () => {
      resolve();
    });
  });
};

// Helper to extract base profile URL (ignore /overlay/ paths and normalize trailing slash)
const getBaseProfileUrl = (url: string): string => {
  // Remove overlay paths first
  let base = url.replace(/\/overlay\/.*$/, '');
  // Normalize trailing slash for consistent comparison
  base = base.replace(/\/$/, '');
  return base;
};

export const SidebarShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // Track current profile URL to trigger re-renders on navigation (ignore overlay URLs)
  const [profileUrl, setProfileUrl] = useState(getBaseProfileUrl(window.location.href));
  
  // LinkedIn resume detection hook
  const { resume: pendingResume, hasPendingResume } = useLinkedInResumeDetection();
  
  // Track if we've already shown the toast for this resume
  const lastToastedResumeId = useRef<number | null>(null);

  // Show toast when a new resume is detected
  useEffect(() => {
    if (pendingResume && pendingResume.downloadId !== lastToastedResumeId.current) {
      console.log('[GoGio][UI] Pending LinkedIn resume detected:', pendingResume);
      lastToastedResumeId.current = pendingResume.downloadId;
      toast.info(`Resume detected: ${pendingResume.filename}`, {
        description: 'Will attach when you add the candidate',
        duration: 5000,
      });
    }
  }, [pendingResume]);

  // Load collapsed state from storage on mount
  useEffect(() => {
    console.log('[GoGio][Sidebar] Mounting SidebarShell');
    getSidebarCollapsed().then((storedCollapsed) => {
      console.log('[GoGio][Sidebar] Loaded collapsed state:', storedCollapsed);
      setCollapsed(storedCollapsed);
      setIsLoaded(true);
    });
  }, []);

  // Listen for URL changes (SPA navigation) - ignore overlay URLs
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string }>;
      const newUrl = customEvent.detail?.url || window.location.href;
      const newBaseUrl = getBaseProfileUrl(newUrl);
      
      // Only update if the base profile URL changed (ignore overlay modals)
      if (newBaseUrl !== profileUrl) {
        console.log('[GoGio][Sidebar] Profile change detected:', newBaseUrl);
        setProfileUrl(newBaseUrl);
      } else {
        console.log('[GoGio][Sidebar] Ignoring overlay URL change:', newUrl);
      }
    };

    window.addEventListener(URL_CHANGE_EVENT, handleUrlChange);
    return () => window.removeEventListener(URL_CHANGE_EVENT, handleUrlChange);
  }, [profileUrl]);

  const handleCollapse = useCallback(() => {
    console.log('[GoGio][Sidebar] Collapsing sidebar');
    setCollapsed(true);
    setSidebarCollapsed(true);
  }, []);

  const handleExpand = useCallback(() => {
    console.log('[GoGio][Sidebar] Expanding sidebar');
    setCollapsed(false);
    setSidebarCollapsed(false);
  }, []);

  // Don't render until we've loaded the collapsed state
  if (!isLoaded) {
    return null;
  }

  const avatarUrl = getAvatarUrl();

  // Floating button when collapsed
  if (collapsed) {
    return (
      <button
        onClick={handleExpand}
        className="gogio-floating-button"
        title="Open GoGio"
        aria-label="Open GoGio sidebar"
      >
        <img 
          src={avatarUrl} 
          alt="GoGio" 
          className="gogio-floating-avatar"
        />
      </button>
    );
  }

  // Full sidebar when expanded
  return (
    <div className="gogio-sidebar">
      {/* Header - 48px height */}
      <div className="gogio-sidebar-header">
        <GoGioLogo size="sm" />
        <button
          className="gogio-collapse-button"
          onClick={handleCollapse}
          title="Close sidebar"
          aria-label="Close GoGio sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Main content - key prop forces re-mount on URL change */}
      <div className="gogio-sidebar-content">
        <CandidatePanelApp key={profileUrl} />
      </div>
      
      {/* Toast container - inside sidebar for proper positioning */}
      <Toaster position="bottom-center" />
    </div>
  );
};