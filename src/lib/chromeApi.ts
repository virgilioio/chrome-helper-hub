// Chrome API helpers with proper type safety
// Uses globalThis pattern to avoid TypeScript errors when not in extension context

interface ChromeTab {
  id?: number;
  url?: string;
}

interface ChromeRuntime {
  lastError?: { message?: string };
  onMessage: {
    addListener: (
      callback: (
        message: any,
        sender: any,
        sendResponse: (response?: any) => void
      ) => boolean | void
    ) => void;
  };
}

interface ChromeTabs {
  query: (
    queryInfo: { active?: boolean; currentWindow?: boolean },
    callback: (tabs: ChromeTab[]) => void
  ) => void;
  sendMessage: (
    tabId: number,
    message: any,
    callback?: (response: any) => void
  ) => void;
}

interface ChromeAPI {
  tabs?: ChromeTabs;
  runtime?: ChromeRuntime;
}

/**
 * Get the Chrome API if available
 */
export const getChrome = (): ChromeAPI | null => {
  if (typeof globalThis !== 'undefined' && 'chrome' in globalThis) {
    return (globalThis as any).chrome as ChromeAPI;
  }
  return null;
};

/**
 * Check if Chrome tabs API is available
 */
export const isChromeTabsAvailable = (): boolean => {
  const chrome = getChrome();
  return !!chrome?.tabs?.query && !!chrome?.tabs?.sendMessage;
};

/**
 * Send a message to the content script in the active tab
 */
export const sendMessageToActiveTab = <T>(
  message: any,
  callback: (response: T | null) => void
): void => {
  const chrome = getChrome();
  if (!chrome?.tabs) {
    callback(null);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      callback(null);
      return;
    }

    chrome.tabs.sendMessage(tab.id, message, (response) => {
      // Check for errors
      if (chrome.runtime?.lastError) {
        console.log('[GoGio] Message send error:', chrome.runtime.lastError.message);
        callback(null);
        return;
      }
      callback(response || null);
    });
  });
};

/**
 * Get the active tab URL
 */
export const getActiveTabUrl = (callback: (url: string | null) => void): void => {
  const chrome = getChrome();
  if (!chrome?.tabs) {
    callback(null);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]?.url || null);
  });
};
