
## Fix LinkedIn Location Extraction

LinkedIn appears to have restructured their profile page, causing the location selectors to match the wrong element (likely grabbing connections count or other metadata instead of the actual location text).

### Problem

The current location selectors in `src/lib/profileExtractor.ts` are too broad. Selectors like `.pv-top-card .text-body-small` match the **first** `.text-body-small` element found in the container, which may now be a different piece of text (e.g., "500+ connections") due to LinkedIn reordering their DOM.

### Solution

Update the location extraction in `src/lib/profileExtractor.ts` to:

1. **Add newer, more specific selectors** that target LinkedIn's current profile layout structure
2. **Add a filtering step** that validates the extracted text actually looks like a location (contains comma-separated place names, not connection counts or other metadata)
3. **Try multiple `.text-body-small` elements** instead of just the first match, checking each one against a location-like pattern

### Changes

**`src/lib/profileExtractor.ts`** -- Update location extraction logic (lines 97-106):

- Add new selectors targeting LinkedIn's 2025/2026 profile layout
- Add a helper function `looksLikeLocation(text)` that filters out non-location text (e.g., text containing "connections", "followers", "mutual", numbers-only strings)
- Change the extraction approach: instead of returning the first `.text-body-small` match, iterate through all candidates and return the first one that passes the location filter
- Keep existing selectors as fallbacks for older profile layouts

**`public/manifest.json`** -- Bump version to `0.2.10`

### Technical Details

The new `looksLikeLocation()` filter will reject text that:
- Contains "connection", "follower", "mutual" (case-insensitive)
- Is purely numeric (e.g., "500+")
- Contains "message", "connect" (button labels)
- Is shorter than 2 characters

The new extraction will use `querySelectorAll` on broad selectors and loop through results, returning the first element whose text passes the filter. This is resilient to DOM reordering since it doesn't depend on element position.
