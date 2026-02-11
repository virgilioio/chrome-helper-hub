

## Fix: Replace Dynamic Imports with Static Imports in Content Script

### Problem
`await import('./sidebarMount')` and `await import('@/lib/profileExtractor')` are **dynamic imports**. esbuild with `format: "iife"` does not support dynamic `import()` -- it can only bundle **static** imports. This causes the built `linkedin-content.js` to fail loading.

### Solution
Switch back to regular static `import` statements at the top of the file. The duplicate-load guard still works -- it just wraps the **side-effect code** (listener registration, history patching), not the imports themselves. Static imports are fine because they only define functions/values without side effects.

### File: `src/content/linkedinContent.ts`

Change from:
```typescript
if ((window as any).__gogio_content_loaded) {
  // skip
} else {
  (window as any).__gogio_content_loaded = true;
  (async () => {
    const { toggleSidebar, ... } = await import('./sidebarMount');  // BROKEN
    const { extractProfileData } = await import('@/lib/profileExtractor');  // BROKEN
    // ... listeners and init code
  })();
}
```

To:
```typescript
import { toggleSidebar, mountSidebar, isSidebarMounted, notifySidebarOfUrlChange } from './sidebarMount';
import { extractProfileData } from '@/lib/profileExtractor';

if ((window as any).__gogio_content_loaded) {
  console.log('[GoGio] Content script already loaded, skipping duplicate');
} else {
  (window as any).__gogio_content_loaded = true;

  // All side-effect code (listeners, history patching) stays inside the guard
  // No async IIFE needed since imports are static

  const getChromeRuntime = () => (globalThis as any).chrome?.runtime;

  getChromeRuntime()?.onMessage?.addListener((...) => {
    // ... all existing message handlers unchanged
  });

  // ... history patching and init logs unchanged
}
```

### Why This Works
- Static imports are resolved at bundle time by esbuild -- they become part of the single IIFE bundle
- The `window.__gogio_content_loaded` guard still prevents duplicate listener registration and history patching
- The imported functions (toggleSidebar, extractProfileData, etc.) are just function definitions with no side effects, so importing them twice is harmless
- No async IIFE wrapper needed, eliminating the complexity

### Single file change
Only `src/content/linkedinContent.ts` needs to be modified.

