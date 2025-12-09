// Sidebar mounting logic for LinkedIn content script
// This file is bundled separately and injected into LinkedIn pages

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SidebarShell } from '@/components/extension/SidebarShell';
import { Toaster } from '@/components/ui/sonner';
import { injectSidebarStyles, removeSidebarStyles, injectAppStyles, removeAppStyles } from './sidebarStyles';

const SIDEBAR_ROOT_ID = 'gogio-sidebar-root';

let sidebarRoot: Root | null = null;
let isMounted = false;

/**
 * Mount the GoGio sidebar into the page
 */
export const mountSidebar = (): void => {
  console.log('[GoGio][Sidebar] Mounting sidebar...');

  if (isMounted) {
    console.log('[GoGio][Sidebar] Sidebar already mounted');
    return;
  }

  // Inject styles first (both sidebar layout and app component styles)
  injectSidebarStyles();
  injectAppStyles();

  // Create container if it doesn't exist
  let container = document.getElementById(SIDEBAR_ROOT_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = SIDEBAR_ROOT_ID;
    document.body.appendChild(container);
    console.log('[GoGio][Sidebar] Created sidebar container');
  }

  // Mount React app
  sidebarRoot = createRoot(container);
  sidebarRoot.render(
    <React.StrictMode>
      <SidebarShell />
      <Toaster position="bottom-right" />
    </React.StrictMode>
  );

  isMounted = true;
  console.log('[GoGio][Sidebar] Sidebar mounted successfully');
};

/**
 * Unmount the GoGio sidebar from the page
 */
export const unmountSidebar = (): void => {
  console.log('[GoGio][Sidebar] Unmounting sidebar...');

  if (!isMounted) {
    console.log('[GoGio][Sidebar] Sidebar not mounted');
    return;
  }

  // Unmount React
  if (sidebarRoot) {
    sidebarRoot.unmount();
    sidebarRoot = null;
  }

  // Remove container
  const container = document.getElementById(SIDEBAR_ROOT_ID);
  if (container) {
    container.remove();
  }

  // Remove styles
  removeSidebarStyles();
  removeAppStyles();

  isMounted = false;
  console.log('[GoGio][Sidebar] Sidebar unmounted successfully');
};

/**
 * Toggle sidebar visibility
 */
export const toggleSidebar = (): void => {
  console.log('[GoGio][Sidebar] Toggling sidebar, currently mounted:', isMounted);
  if (isMounted) {
    unmountSidebar();
  } else {
    mountSidebar();
  }
};

/**
 * Check if sidebar is currently mounted
 */
export const isSidebarMounted = (): boolean => isMounted;
