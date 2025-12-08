// Chrome Storage utilities for the extension
// Falls back to localStorage when not in Chrome extension context

export interface StoredPreferences {
  token?: string;
  lastOrganizationId?: string;
  lastJobId?: string;
  lastStageId?: string;
}

const STORAGE_KEY = 'gogio_extension_prefs';

// Check if we're in a Chrome extension context
const isChromeExtension = (): boolean => {
  return typeof globalThis !== 'undefined' && 
         'chrome' in globalThis && 
         typeof (globalThis as any).chrome?.storage?.sync !== 'undefined';
};

const getChromeStorage = () => (globalThis as any).chrome?.storage?.sync;
const getChromeTabs = () => (globalThis as any).chrome?.tabs;

export const getStoredPreferences = async (): Promise<StoredPreferences> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      getChromeStorage().get([STORAGE_KEY], (result: Record<string, StoredPreferences>) => {
        resolve(result[STORAGE_KEY] || {});
      });
    });
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const setStoredPreferences = async (prefs: Partial<StoredPreferences>): Promise<void> => {
  const current = await getStoredPreferences();
  const updated = { ...current, ...prefs };
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      getChromeStorage().set({ [STORAGE_KEY]: updated }, resolve);
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearStoredPreferences = async (): Promise<void> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      getChromeStorage().remove([STORAGE_KEY], resolve);
    });
  }
  localStorage.removeItem(STORAGE_KEY);
};

export const getToken = async (): Promise<string | undefined> => {
  const prefs = await getStoredPreferences();
  return prefs.token;
};

export const setToken = async (token: string): Promise<void> => {
  await setStoredPreferences({ token });
};

export const clearToken = async (): Promise<void> => {
  const prefs = await getStoredPreferences();
  delete prefs.token;
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      getChromeStorage().set({ [STORAGE_KEY]: prefs }, resolve);
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

export const getCurrentTabUrl = async (): Promise<string | null> => {
  const tabs = getChromeTabs();
  if (isChromeExtension() && tabs) {
    return new Promise((resolve) => {
      tabs.query({ active: true, currentWindow: true }, (tabList: any[]) => {
        resolve(tabList[0]?.url || null);
      });
    });
  }
  return window.location.href;
};

export const getLinkedInUrl = async (): Promise<string | null> => {
  const url = await getCurrentTabUrl();
  if (url && url.includes('linkedin.com/in/')) {
    const match = url.match(/(https?:\/\/[^/]*linkedin\.com\/in\/[^/?#]+)/);
    return match ? match[1] : url.split('?')[0];
  }
  return null;
};
