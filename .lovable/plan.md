

## Fix API Proxy Architecture: Eliminate chrome-extension://invalid/ URLs

### Root Cause Analysis

There are two separate issues causing the error:

1. **Asset loading triggers `chrome-extension://invalid/` fetches**: `GioFlipLoader.tsx` uses `getAssetUrl()` which calls `chrome.runtime.getURL()` without checking context validity first. When the runtime is in a transitional state (e.g., right after OAuth completes but before context fully stabilizes), this produces `chrome-extension://invalid/gio-face-1.png` network requests that fail.

2. **400 error from API proxy**: The `getMe()` call after OAuth goes through the background proxy correctly, but the 400 likely comes from the backend rejecting the request (separate from the `chrome-extension://invalid/` issue). Debug logs will help confirm this.

### Changes

#### 1. `src/components/extension/GioFlipLoader.tsx` -- Use safe URL helper
- Replace the local `getAssetUrl` function with `getSafeExtensionUrl` from `chromeApi.ts`, which already checks `chrome.runtime.id` before calling `getURL`
- Provide fallback path when extension context is invalid

#### 2. `src/lib/chromeApi.ts` -- Remove getURL probe from validity check
- Remove the `chrome.runtime.getURL('test')` call from `isExtensionContextValid()` -- checking `chrome.runtime.id` alone is sufficient, and the `getURL` call can trigger browser-level network requests in some contexts
- Add debug logging to `isExtensionContextValid()`

#### 3. `src/lib/api.ts` -- Add debug logs before proxy usage
- Add `console.log("[Debug] runtime.id", ...)` and `console.log("[Debug] location.href", ...)` before the proxy path to verify correct context detection during OAuth validation
- Log the full endpoint being requested

#### 4. `src/lib/oauthBridge.ts` -- Add debug log to context detection
- Add a debug log inside `isContentScriptContext()` showing the detection result and the values it checks

### Technical Details

**GioFlipLoader fix:**
```typescript
import { getSafeExtensionUrl } from '@/lib/chromeApi';

const getAssetUrl = (filename: string): string => {
  return getSafeExtensionUrl(filename) || `/${filename}`;
};
```

**isExtensionContextValid simplification (chromeApi.ts):**
```typescript
export const isExtensionContextValid = (): boolean => {
  try {
    const chrome = (globalThis as any).chrome;
    if (!chrome?.runtime) return false;
    if (!chrome.runtime.id) return false;
    // Removed getURL probe -- runtime.id check is sufficient
    return true;
  } catch {
    return false;
  }
};
```

**Debug logs in api.ts requestViaProxy:**
```typescript
console.log('[Debug] runtime.id', (globalThis as any).chrome?.runtime?.id);
console.log('[Debug] location.href', location.href);
console.log('[Debug] isContentScript:', isContentScriptContext());
```

These changes ensure no `chrome-extension://` URLs are ever fetched in content script context, and provide visibility into the 400 error source.

