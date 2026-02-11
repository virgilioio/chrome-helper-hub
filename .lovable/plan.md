

## Fix: Eliminate chrome-extension://invalid/ and Add Backend Error Diagnostics

### Problem
1. Image components fall back to `'/filename.png'` when `getSafeExtensionUrl` returns empty, which on LinkedIn resolves to `https://www.linkedin.com/filename.png` or triggers stale `chrome-extension://invalid/` requests
2. The 400 error from the backend lacks diagnostic detail -- we need to see the exact URL fetched and full response body

### Changes

#### A. Image fallbacks -- render CSS/text instead of broken `<img>` tags

**1. `src/components/extension/GioFlipLoader.tsx`**
- When `getSafeExtensionUrl` returns empty, render a pulsing CSS circle (purple, branded) instead of an `<img>` tag
- No network request occurs

**2. `src/components/extension/GoGioLogo.tsx`**
- When URL is empty, render a styled text span "GoGio" instead of `<img>`

**3. `src/components/extension/SidebarShell.tsx`**
- When avatar URL is empty, render a purple CSS circle with "G" initial instead of `<img>`

#### B. Enhanced debug logging

**4. `src/lib/api.ts`**
- Add log before proxy call: `[ApiClient] Proxy request: METHOD endpoint`

**5. `public/background.js`**
- Log the exact full URL being fetched: `[GoGio][Background] Fetching URL: <fullUrl>`
- On non-ok response, log status and full response text

#### C. Version bump

**6. `public/manifest.json`** -- bump to `0.2.7`

### Technical Detail

The key insight: the `|| '/gogio-logo.png'` fallback is the source of `chrome-extension://invalid/` requests. When the extension context is invalid, `getSafeExtensionUrl` correctly returns `''`, but then `|| '/gogio-logo.png'` creates a relative URL that the browser resolves against the current origin. In some states this produces `chrome-extension://invalid/gogio-logo.png`. The fix is to never render an `<img>` when there's no valid URL.

