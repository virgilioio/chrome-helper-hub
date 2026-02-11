

## Fix: Content Script Build Error (Top-Level Await in IIFE)

### Problem
The duplicate-load guard introduced `await import(...)` at the top level of the content script. The build config uses `format: "iife"` (required for Chrome content scripts), which does **not** support top-level `await`. This causes the built `linkedin-content.js` to fail loading.

### Solution
Wrap the entire `else` block in an **async IIFE** `(async () => { ... })()` so the `await` calls are inside a function scope, which is valid in IIFE format.

### File: `src/content/linkedinContent.ts`

Change the structure from:

```text
if ((window as any).__gogio_content_loaded) {
  ...
} else {
  (window as any).__gogio_content_loaded = true;
  const { ... } = await import('./sidebarMount');  // TOP-LEVEL AWAIT - breaks IIFE
  ...
}
```

To:

```text
if ((window as any).__gogio_content_loaded) {
  ...
} else {
  (window as any).__gogio_content_loaded = true;
  (async () => {
    const { ... } = await import('./sidebarMount');
    // ... rest of existing code stays the same, just indented one level
  })();
}
```

This is a single-file, structural-only change. No logic changes needed.

