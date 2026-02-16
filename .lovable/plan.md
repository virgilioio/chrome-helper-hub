

## Fix "Project not specified" 400 Error

### Root Cause

The extension's API URL uses the **Lovable project ID** (`aba41743-...`) in a Lovable Cloud proxy domain (`*.functions.supabase.co`). This proxy can no longer route the request to your Supabase project, returning "Project not specified" at the infrastructure level -- before the edge function code ever runs.

The actual Supabase project ref is `etrxjxstjfcozdjumfsj`. The edge function code and its `verify_jwt = false` config are both correct -- this is purely a URL routing issue.

### Fix: Switch to Direct Supabase URL + Add apikey Header

We'll update the GATEWAY_URL to go directly to Supabase (bypassing the Lovable proxy) and include the required `apikey` header for project identification.

**New URL:** `https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1/chrome-api-gateway`

### Changes

**1. `src/lib/api.ts`** -- Update GATEWAY_URL and add apikey header to direct fetch

- Change `GATEWAY_URL` from `https://aba41743-9dfe-4b0e-88f2-0c24aeb910c4.functions.supabase.co/chrome-api-gateway` to `https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1/chrome-api-gateway`
- Add `apikey` header to the direct fetch path (popup context)

**2. `public/background.js`** -- Update GATEWAY_URL and add apikey header to proxy fetch

- Change `GATEWAY_URL` to the direct Supabase URL
- Add `apikey` header to the proxy fetch

**3. `public/manifest.json`** -- Update host_permissions

- Add `https://etrxjxstjfcozdjumfsj.supabase.co/*` to `host_permissions`
- Keep the old `*.supabase.co` permission for backward compatibility, or replace it

### Technical Details

The Supabase anon key (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0cnhqeHN0amZjb3pkanVtZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzM3MjMsImV4cCI6MjA2NTEwOTcyM30.xhhEmT2ikIqFO9IiZZC22zhWlSTC-ytBxP6EGGXtC44`) is a **publishable** key -- it's safe to include in client-side code. It's already public in the GoGioATS web app.

The `apikey` header tells Supabase which project the request belongs to. Combined with the project ref in the URL, this ensures proper routing even with `verify_jwt = false`.

### After Applying

1. Rebuild the extension
2. Remove and re-load the unpacked extension from `dist`
3. Test the OAuth login flow from the LinkedIn sidebar
4. The `getMe()` call should now reach the edge function and succeed

