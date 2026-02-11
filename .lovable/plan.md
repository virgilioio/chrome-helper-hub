

## Fix: Eliminate chrome-extension://invalid/ Errors and Harden Proxy

### Root Cause

The API proxy architecture is already correct -- `requestViaProxy` uses `chrome.runtime.sendMessage()`, not fetch to `chrome-extension://` URLs. The `chrome-extension://invalid/` error in the console comes from **image asset loading** (GioFlipLoader faces, GoGioLogo, SidebarShell avatar) where `getSafeExtensionUrl` can return a stale or invalid URL during extension reload transitions.

The **400 error** from the background proxy is a separate backend issue (the gateway returning 400 for the `me` action), not caused by the proxy architecture itself.

### Changes

#### 1. `src/lib/chromeApi.ts` -- Harden getSafeExtensionUrl with post-check
- After calling `chrome.runtime.getURL(path)`, verify the returned URL does NOT contain `"invalid"` before returning it
- This catches the edge case where `runtime.id` exists but `getURL` still returns `chrome-extension://invalid/...`

#### 2. `src/components/extension/GioFlipLoader.tsx` -- Lazy asset URL resolution
- Move `getAssetUrl` call inside the render so it re-evaluates on each render cycle
- Add an `onError` handler to images so failed loads don't produce visible errors

#### 3. `src/components/extension/GoGioLogo.tsx` -- Same lazy URL + error handling
- Compute URL inside render, not at module level
- Add `onError` fallback

#### 4. `src/components/extension/SidebarShell.tsx` -- Same for avatar URL
- Compute `avatarUrl` inside render (already does this, but add error handling)

#### 5. `src/lib/api.ts` -- Add better error context to 400 responses
- When the proxy returns 400, include the response data in the error message so we can see what the backend actually said
- This helps diagnose the real 400 issue

#### 6. `public/manifest.json` -- Bump version to 0.2.6
- Patch version bump for Chrome Web Store update

### Technical Details

**chromeApi.ts fix:**
```typescript
export const getSafeExtensionUrl = (path: string): string => {
  try {
    const chrome = (globalThis as any).chrome;
    if (chrome?.runtime?.getURL && chrome.runtime.id) {
      const url = chrome.runtime.getURL(path);
      // Double-check the URL doesn't contain "invalid"
      if (url.includes('invalid')) return '';
      return url;
    }
  } catch {}
  return '';
};
```

**GioFlipLoader.tsx -- move URL into render:**
```typescript
// Remove module-level getAssetUrl call
// Inside component render:
const faceUrl = getSafeExtensionUrl(GIO_FACES[currentFace]) || `/${GIO_FACES[currentFace]}`;
```

**api.ts -- better 400 error logging:**
```typescript
if (!response.ok) {
  const errDetail = typeof response.data === 'string' 
    ? response.data 
    : JSON.stringify(response.data);
  console.error('[ApiClient] Proxy error detail:', errDetail);
  // ... existing error handling
}
```

### Files Changed
- `src/lib/chromeApi.ts` -- harden getSafeExtensionUrl
- `src/components/extension/GioFlipLoader.tsx` -- inline URL resolution
- `src/components/extension/GoGioLogo.tsx` -- inline URL resolution
- `src/components/extension/SidebarShell.tsx` -- add image error handling
- `src/lib/api.ts` -- better 400 error context
- `public/manifest.json` -- bump to 0.2.6

### Test Steps
1. Load unpacked extension in Chrome
2. Navigate to LinkedIn profile
3. Click GoGio icon to open sidebar
4. Login via OAuth
5. Confirm no `chrome-extension://invalid/` in console
6. Confirm `getMe()` returns 200 (or diagnose 400 with new error details)

