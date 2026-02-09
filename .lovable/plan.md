

# Fix LinkedIn Profile Autofill - Updated Selectors and Retry Logic

## Problem
The Chrome extension is no longer auto-filling candidate information (name, city, country, work info) from LinkedIn profiles. LinkedIn has recently updated their UI and class names, causing the DOM selectors in `profileExtractor.ts` to fail silently.

## Root Causes
1. **Stale CSS class selectors** -- The current code relies on exact LinkedIn class names like `text-heading-xlarge`, `text-body-medium.break-words`, and `t-black--light.break-words` that LinkedIn has changed
2. **No retry logic** -- Extraction runs once after 300ms; if LinkedIn's SPA hasn't rendered yet, everything returns null
3. **Silent failures** -- No logging to trace which selectors fail

## Solution

### File 1: `src/lib/profileExtractor.ts`

**A. Update name selectors** -- Add broader, more resilient selectors:
- Keep existing `h1.text-heading-xlarge` and `h1.inline.t-24`
- Add `h1[class*="text-heading"]` (partial class match survives minor class name changes)
- Add `.pv-top-card h1` and `.ph5 h1` (structural selectors based on page hierarchy)
- Keep bare `h1` as final fallback but scope it to the profile area to avoid grabbing wrong h1

**B. Update headline selectors** -- Add broader patterns:
- Keep existing selectors
- Add `.text-body-medium` without requiring `.break-words`
- Add `.pv-top-card .text-body-medium`, `.ph5 .text-body-medium`

**C. Update location selectors** -- Add broader patterns:
- Keep existing selectors  
- Add `.text-body-small` scoped to the top card area
- Add `.pv-top-card--list-bullet .text-body-small` and `.pb2 .text-body-small`

**D. Update experience section selectors** -- Add newer DOM patterns:
- Add `.pvs-list__outer-container` container selector
- Add `[id*="profilePagedListComponent"]` pattern
- For role/company within experience entries, add `.pvs-entity` selectors
- Add `span[aria-hidden="true"]` within `.pvs-entity` patterns

**E. Add diagnostic logging** -- Log each extraction attempt with the selector that matched (or "none matched") so future failures are easily debugged

**F. Add `extractProfileDataWithRetry()` function:**
- Attempts extraction up to 3 times with delays of 500ms, 1500ms, 3000ms
- After each attempt, checks if `fullName` was found (primary success indicator)
- Returns as soon as meaningful data is extracted
- Falls back to final attempt result if all retries exhaust

### File 2: `src/components/extension/CandidateForm.tsx`

**Update the autofill `useEffect`** (around line 123):
- In content script context: replace `extractProfileData()` call with `extractProfileDataWithRetry()`
- Since `extractProfileDataWithRetry` is async and handles its own delays, remove the `setTimeout(..., 300)` wrapper
- Add logging when autofill succeeds or fails
- Keep popup message-passing path unchanged

### Version Bump: `public/manifest.json`
- Bump version to `0.2.5`

## Technical Notes
- LinkedIn uses dynamic CSS class names that change during UI refreshes. The fix adds both exact and partial-match selectors (`[class*="..."]`) for resilience.
- The retry approach handles LinkedIn's SPA rendering where profile content loads asynchronously after navigation.
- All existing selectors are kept as fallbacks -- new selectors are added before them in priority order.

