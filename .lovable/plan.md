

## Add Production Extension Key to Manifest

### What This Does
Adding the public key to `manifest.json` forces your local unpacked extension to use the same ID as the production Chrome Web Store version (`nhkooggcjgdckjlpbogeanhohjkndhcj`). This means the OAuth redirect URI will match what your backend already has whitelisted, so login will work in dev mode.

### Change

**File: `public/manifest.json`**

Add a `"key"` field at the top level of the manifest object, right after `"manifest_version": 3`:

```json
"key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAohSyaeCnlwOAc9tlnRexYld7Uhnc9jykFShIPQVL432oF3zsHNMytvy82OirGONCHgi1HUFY9Vcei8j7/oor3Ii36nZTKazEiyFPAhl+bAyOg2HkAAd3QHi+dxV5WHwFMx4DzRlDUHPgv43VWxYdZf0OLzS6u+wMbZax7Lmj6EhgjqYzlpsYam4WJs24oJslvLt5gShJYDZUECCc1e8aybQzznSmqwLG+LZcKF2DCnko/mC+dhRxhTywd3OcW5d8D93rjjcSajy/9yFzPLd1m/B1ZMeGx7FlJ6xhuKPrE2z5/39WkQQ37hUb/seKhELLZQEYzm4mMUBpkN78Pu0XFQIDAQAB"
```

### After Applying
1. Remove the current unpacked extension from `chrome://extensions`
2. Rebuild and re-load the unpacked extension from the `dist` folder
3. Verify the extension ID now shows as `nhkooggcjgdckjlpbogeanhohjkndhcj`
4. Test the OAuth login flow -- the redirect URI should now be accepted

### Note
The `key` field is safe to keep in production builds -- Chrome Web Store ignores it and uses its own key. It only affects unpacked/dev loads.

