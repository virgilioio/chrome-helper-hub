

## Fix OAuth to Support Dynamic Extension IDs

### Problem
The OAuth flow hardcodes the start URL without telling the backend which extension ID to redirect back to. This causes failures when the extension ID changes (e.g., between development and production builds).

### Solution
Append `redirect_uri` as a query parameter to `OAUTH_START_URL` using `chrome.identity.getRedirectURL("provider_cb")`, which dynamically resolves to the correct `https://<EXTENSION_ID>.chromiumapp.org/provider_cb`.

### Changes

#### 1. `src/lib/oauth.ts` (startChromeOAuthFlow)
- Build the OAuth URL by appending `?redirect_uri=<encoded redirect URL>` using `identity.getRedirectURL("provider_cb")`
- Pass this constructed URL to `launchWebAuthFlow` instead of the bare `OAUTH_START_URL`

#### 2. `public/background.js` (START_OAUTH handler)
- Same change: construct the URL with `chrome.identity.getRedirectURL("provider_cb")` as the `redirect_uri` query param before passing to `launchWebAuthFlow`

### Technical Details

Both files will construct the URL like this:

```text
const redirectUri = chrome.identity.getRedirectURL("provider_cb");
const oauthUrl = `${OAUTH_START_URL}?redirect_uri=${encodeURIComponent(redirectUri)}`;
```

Resulting URL example:
```text
https://app.gogio.io/chrome-oauth/start?redirect_uri=https%3A%2F%2Fnhkooggcjgdckjlpbogeanhohjkndhcj.chromiumapp.org%2Fprovider_cb
```

Token parsing (`#token=...`) remains unchanged in both files.

### Backend Requirement
The GoGio backend's `/chrome-oauth/start` endpoint must read the `redirect_uri` query parameter and use it as the redirect target instead of a hardcoded value. This is a separate change in the backend project.

