

## Fix "Project not specified" 400 Error

### What's Wrong

I checked the [GoGioATS](/projects/aba41743-9dfe-4b0e-88f2-0c24aeb910c4) main app project and confirmed:
- The edge function `chrome-api-gateway` is correctly configured with `verify_jwt = false`
- The function code is fine and handles its own authentication
- CORS is set up to allow Chrome extension origins

The problem is the **URL** the extension uses to call the API. The extension currently calls:
```
https://aba41743-9dfe-4b0e-88f2-0c24aeb910c4.functions.supabase.co/chrome-api-gateway
```
This is a **Lovable Cloud proxy URL** that no longer routes correctly to your Supabase project, returning "Project not specified" before your function code ever runs.

Your actual Supabase project ref is `etrxjxstjfcozdjumfsj` (confirmed from `supabase/config.toml` in the main app).

### The Fix

Switch to the direct Supabase edge function URL and add the required `apikey` header. No backend changes needed -- the edge function is working fine.

### Changes (3 files)

**1. `src/lib/api.ts`**
- Change `GATEWAY_URL` to `https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1/chrome-api-gateway`
- Add a `SUPABASE_ANON_KEY` constant
- Add `apikey` header to the direct fetch path (popup context)

**2. `public/background.js`**
- Change `GATEWAY_URL` to `https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1/chrome-api-gateway`
- Add `SUPABASE_ANON_KEY` constant
- Add `apikey` header to the proxy fetch

**3. `public/manifest.json`**
- Add `https://etrxjxstjfcozdjumfsj.supabase.co/*` to `host_permissions`

### Why This Is Safe

The Supabase anon key is a **publishable** key -- it's already public in the GoGioATS web app. It just tells the Supabase gateway which project the request belongs to. The actual security comes from the GoGio token validated inside the edge function.

### After Applying

1. Rebuild the extension
2. Remove and re-load the unpacked extension from `dist`
3. Test the OAuth login flow from the LinkedIn sidebar
4. The `getMe()` call should now reach the edge function and succeed

