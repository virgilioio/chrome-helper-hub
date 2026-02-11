

## Fix Duplicate Content Script Loading and Sidebar Glitch

### Problem
The content script is loading **twice** on LinkedIn pages:
- Once via the manifest's `content_scripts` auto-injection
- Again via the background script's `ensureContentScriptReady()` calling `chrome.scripting.executeScript()`

Each injection creates a separate JavaScript module scope with its own `isMounted = false`, so both instances react to `TOGGLE_SIDEBAR` and mount separate sidebars -- causing the glitch.

### Changes

**1. `src/content/linkedinContent.ts`** -- Add a duplicate-load guard

At the very top of the file, check for a global marker on `window`. If already set, bail out immediately. This prevents the second injection from registering duplicate listeners.

```text
// Top of file:
if ((window as any).__gogio_content_loaded) {
  console.log('[GoGio] Content script already loaded, skipping duplicate');
  // Don't register any listeners or overrides
} else {
  (window as any).__gogio_content_loaded = true;
  // ... rest of existing code
}
```

**2. `public/background.js`** -- Make `ensureContentScriptReady` less aggressive

The PING check already works -- if the content script responds, skip re-injection. The issue is that `executeScript` re-injects even when manifest already did it but PING failed due to timing. Add a small retry before re-injecting:

```text
// In ensureContentScriptReady:
// Try PING twice with a delay before falling back to injection
```

### About the other issues

- **`chrome-extension://invalid/` errors**: These originate from LinkedIn's own scripts (stack trace: `5fdhwcppjcvqvxsawd8pg1n51`), not from our extension. They are harmless and cannot be fixed on our side.

- **"Invalid redirect URI"**: Your dev extension ID generates redirect URL `https://okkkglbelakkhphmbgabailjbmkpjfka.chromiumapp.org/provider_cb`. This URL must be whitelisted on your GoGio backend (app.gogio.io). This is a server-side configuration change, not something we can fix in the extension code.

### Technical Details

The root cause is that Chrome's `chrome.scripting.executeScript()` creates a new module execution context, separate from the manifest-injected one. Both register `chrome.runtime.onMessage` listeners, so every message gets handled twice. The window-level guard (`__gogio_content_loaded`) works because both injections share the same `window` object on the page.
