

## Issues Found and Fixes

### Issue 1: Profile extraction (name, company, role) failing
**Root cause**: LinkedIn periodically changes their DOM structure. The current selectors in `profileExtractor.ts` may not match the latest LinkedIn markup. Additionally, the `extractProfileDataWithRetry` starts at 500ms which may be too early for slower connections.

**Fix in `src/lib/profileExtractor.ts`**:
- Add newer LinkedIn DOM selectors (e.g., `main section:first-of-type h1`, `div[data-generated-suggestion-target] ~ span`, and broader `[class*="text-heading"]` patterns)
- Add `innerText`-based fallback when `textContent` picks up hidden accessibility text
- Increase first retry delay from 500ms to 800ms
- Add a new selector approach: walk the DOM from the profile photo container upward to find the name heading

### Issue 2: Apollo enrichment not returning phone numbers
**Root cause**: In [GoGioATS](/projects/aba41743-9dfe-4b0e-88f2-0c24aeb910c4), the `chrome-api-gateway` enrich handler (line 861) does NOT pass `reveal_phone_number: true` to Apollo's bulk_match API. The other enrichment functions (`enrich-apollo-profile`, `enrich-by-linkedin`) already include this flag. This is a one-line fix in the GoGioATS project.

**Fix in GoGioATS** `supabase/functions/chrome-api-gateway/index.ts` (line 862):
```javascript
body: JSON.stringify({
  details: [{ linkedin_url }],
  reveal_phone_number: true,  // ADD THIS
})
```

**Fix in this extension** `src/components/extension/CandidateForm.tsx`: Also use `contact_phones` array from enrich response as fallback when `phone` is null (Apollo sometimes returns phones only in the array).

### Issue 3: "Contact info already filled" toast but fields appear empty
**Root cause**: Lines 642-645 — when the DOM scrape finds email/phone data AND the form fields already have values (from a prior auto-fill or fetch), it shows "Contact info already filled" and returns without doing anything. The user doesn't realize the fields were already populated further down in the form.

**Fix in `src/components/extension/CandidateForm.tsx`**:
- Change the toast to actually show what data exists: `"Email and phone already filled"` or `"Email: john@... already in form"`
- If only one field is filled and the other is empty, still try to fill the empty one from enrichment
- Remove the early return so it can fall through to API enrichment for missing fields

### Issue 4: Show duplicate candidate indicator BEFORE submission
**Root cause**: Currently the duplicate banner only appears after form submission. User wants to know immediately if the candidate is already in the ATS.

**Fix**: Add a pre-check when LinkedIn URL is detected (on mount/autofill) or when email is entered. This requires a new backend action in the gateway.

**Simpler approach** (no backend change): After autofill populates the LinkedIn URL, call `submitCandidate` in a "dry-run" style — but this doesn't exist. Instead, we can add a lightweight `lookup` action to the gateway.

**Recommended approach**: Add a `lookup` action to the chrome-api-gateway in GoGioATS that checks if a candidate exists by LinkedIn URL or email, returning basic info. Then in the extension, call this after autofill to show an "Already in ATS" badge with an "Open" link.

---

### Implementation Plan

#### This project (Chrome Extension):

1. **`src/lib/profileExtractor.ts`** — Add broader, more resilient LinkedIn DOM selectors for name, headline, location, company, and role. Add `innerText` fallback. Increase initial retry delay.

2. **`src/components/extension/CandidateForm.tsx`** — Three changes:
   - Fix "Fetch Contact" logic: remove misleading "already filled" toast, show specific field info, use `contact_phones` array from enrichment response as phone fallback
   - Fix enrichment to also populate `currentRole` and `currentCompany` from Apollo's `title` and `company` fields when form fields are empty
   - Add pre-submission duplicate check: after LinkedIn URL is set via autofill, call a lookup endpoint to check if candidate exists, show a persistent banner with "Open in GoGio" link

3. **`src/lib/api.ts`** — Add `lookupCandidate(linkedinUrl: string, email?: string)` method that calls a new `lookup` action on the gateway

#### GoGioATS project (separate change needed):

4. **`supabase/functions/chrome-api-gateway/index.ts`** — Two changes:
   - Add `reveal_phone_number: true` to the enrich Apollo request body
   - Add new `lookup` action handler that checks if a candidate exists by LinkedIn URL or email and returns `{ exists, candidate_id, candidate_name, candidate_url, current_jobs }`

