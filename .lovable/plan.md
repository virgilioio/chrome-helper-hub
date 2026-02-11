

## Fix Remaining `chrome-extension://invalid/` Error

### Root Cause Found

**`src/components/extension/TokenSetup.tsx` line 62** still has an unsafe fallback:

```typescript
const getAvatarUrl = (): string => {
  return getSafeExtensionUrl('gio-face-2.png') || '/gio-face-2.png';  // <-- BUG
};
```

When the extension context is invalid, `getSafeExtensionUrl` returns `''`, then `|| '/gio-face-2.png'` kicks in, and line 169 renders `<img src="/gio-face-2.png">` unconditionally -- no empty-check like the other components have.

The previous fix updated `GioFlipLoader`, `GoGioLogo`, and `SidebarShell` but **missed `TokenSetup.tsx`**.

### Changes

**1. `src/components/extension/TokenSetup.tsx`**

- Remove the `|| '/gio-face-2.png'` fallback from `getAvatarUrl()`
- Add a conditional render on line 169: if `avatarUrl` is empty, show a CSS circle with "G" initial instead of `<img>`

**2. `src/lib/api.ts`** -- Add proxy request logging (from original plan, if not yet applied)

**3. `public/background.js`** -- Add full URL and error body logging (from original plan, if not yet applied)

### Technical Details

```text
TokenSetup.tsx changes:
  Line 62: return getSafeExtensionUrl('gio-face-2.png');  // remove fallback
  Line 169: wrap <img> in conditional, add CSS circle fallback
```

This is the last remaining source of `chrome-extension://invalid/` network requests.

