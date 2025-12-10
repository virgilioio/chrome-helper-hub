import { useEffect, useState, useCallback } from 'react';

interface LinkedInResume {
  filename: string;
  url: string;
  downloadId: number;
  downloadedAt: number;
}

/**
 * Hook to detect when a LinkedIn PDF resume has been downloaded.
 * Reads from chrome.storage.local and listens for changes.
 */
export function useLinkedInResumeDetection() {
  const [resume, setResume] = useState<LinkedInResume | null>(null);

  // Load initial state from storage and listen for changes
  useEffect(() => {
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.storage?.local) {
      console.log('[GoGio][ResumeHook] Chrome storage not available');
      return;
    }

    // Read initial value
    chromeApi.storage.local.get(['gogio_last_linkedin_resume'], (result: any) => {
      if (result?.gogio_last_linkedin_resume) {
        console.log('[GoGio][ResumeHook] Loaded resume from storage:', result.gogio_last_linkedin_resume);
        setResume(result.gogio_last_linkedin_resume);
      }
    });

    // Listen for changes to the resume storage key
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.gogio_last_linkedin_resume) {
        const newValue = changes.gogio_last_linkedin_resume.newValue;
        console.log('[GoGio][ResumeHook] Resume storage changed:', newValue);
        setResume(newValue || null);
      }
    };

    chromeApi.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chromeApi.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Function to clear the pending resume (after user acts on it)
  const clearPendingResume = useCallback(() => {
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.storage?.local) return;
    
    chromeApi.storage.local.remove(['gogio_last_linkedin_resume'], () => {
      console.log('[GoGio][ResumeHook] Cleared pending resume from storage');
      setResume(null);
    });
  }, []);

  return {
    resume,
    hasPendingResume: !!resume,
    clearPendingResume,
  };
}
