

## Add Contact Enrichment API Fallback

When the free LinkedIn DOM scrape finds no contact info, the extension will fall back to an API-based enrichment call (costing 1 credit) to find email/phone data.

### Changes

#### 1. `src/lib/api.ts` — Add enrichment interface and method

- Add `EnrichContactResponse` interface after the existing `ResumeUploadResponse` interface (after line 77)
- Add `enrichContact(linkedinUrl)` method to the `ApiClient` class, calling `action=enrich` via POST

#### 2. `src/components/extension/CandidateForm.tsx` — Update Fetch Contact handler

Replace the existing onClick handler (lines 593-619) with the two-step logic:
1. First attempt free DOM scrape (existing behavior)
2. If DOM scrape finds nothing, fall back to `apiClient.enrichContact(linkedinUrl)` using the `linkedinUrl` state variable (note: the provided code references `formData?.linkedin_url` but the actual state variable in this file is `linkedinUrl`)
3. Handle credit exhaustion errors with a user-friendly toast message

#### 3. `public/manifest.json` — Bump version to 0.2.9

Reflect the new enrichment feature in the version number.

### Technical Notes

- `apiClient` is already imported in CandidateForm.tsx -- no new imports needed
- The LinkedIn URL state variable is `linkedinUrl` (not `formData?.linkedin_url`), so the fallback line will use `linkedinUrl` directly
- The enrichment endpoint (`action=enrich`) must already exist on the Supabase edge function side (handled in the GoGioATS project)

