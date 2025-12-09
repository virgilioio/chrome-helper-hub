import React, { useEffect, useState } from 'react';
import { CandidatePanelApp } from './CandidatePanelApp';
import { GoGioLogo } from './GoGioLogo';
import { PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export const SidebarShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load collapsed state from storage on mount
  useEffect(() => {
    console.log('[GoGio][Sidebar] Mounting SidebarShell');
    getSidebarCollapsed().then((storedCollapsed) => {
      console.log('[GoGio][Sidebar] Loaded collapsed state:', storedCollapsed);
      setCollapsed(storedCollapsed);
      setIsLoaded(true);
    });
  }, []);

  const handleCollapse = () => {
    console.log('[GoGio][Sidebar] Collapsing sidebar');
    setCollapsed(true);
    setSidebarCollapsed(true);
  };

  const handleExpand = () => {
    console.log('[GoGio][Sidebar] Expanding sidebar');
    setCollapsed(false);
    setSidebarCollapsed(false);
  };

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
      {/* Header */}
      <div className="gogio-sidebar-header">
        <GoGioLogo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          className="gogio-collapse-button"
          onClick={handleCollapse}
          title="Collapse sidebar"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="gogio-sidebar-content">
        <CandidatePanelApp />
      </div>
    </div>
  );
};
