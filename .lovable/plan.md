

# Fix Profile Extraction Quality Issues

## Root Causes Identified

1. **Name has artifacts**: `cleanText(h1)` picks up LinkedIn verification badges, pronouns "(He/Him)", connection degree "1st", and invisible spans concatenated into the name string
2. **Headline grabs too much**: sibling div scan returns entire containers with connection counts, mutual friends text mixed in
3. **First extraction sticks**: `applyProfileData` only fills empty fields, so the first (dirty) reactive emission permanently sets wrong values
4. **Location/company/role**: structural approach is correct in principle but scan is too broad, grabbing non-target text

## Changes

### 1. `src/lib/profileExtractor.ts` — Clean extracted values

**Name cleaning** — Add `cleanName()` function after extraction:
- Strip common LinkedIn artifacts: "(He/Him)", "(She/Her)", "(They/Them)" and similar pronoun patterns
- Remove connection degree indicators: "1st", "2nd", "3rd", "1st degree connection"
- Remove verification badge text (Unicode chars like ✓, ✔, or text "Verified")
- Collapse multiple spaces to single space
- Apply in `extractFullName()` before returning each strategy result

**Headline isolation** — Modify Strategy 1 in `extractHeadline()`:
- Instead of `cleanText(candidate)` on sibling divs, first try `candidate.querySelector('div')?.innerText` or direct `childNodes` text content
- Skip if text contains "connections", "followers", "mutual"
- Limit length more aggressively (< 150 chars instead of 300)

**Location narrowing** — Modify `extractLocationField()`:
- After finding the h1, only scan elements that are siblings or close descendants of the h1's parent container (not the entire section)
- Skip elements whose text matches the already-extracted name or headline
- Add a blocklist: "connections", "followers", "mutual", "message", "more"

**Experience section** — Modify `extractCurrentRole()` and `extractCurrentCompany()`:
- Remove reliance on `[class*="bold"]` — instead, in the first `li`, get all `span[aria-hidden="true"]` elements, take the first as role (it's visually prominent/first in DOM order) and second as company
- Strip employment type suffixes from company: "· Full-time", "· Part-time", "· Contract"

### 2. `src/components/extension/CandidateForm.tsx` — Allow reactive overwrites

**Change `applyProfileData`** (lines 218-266):
- Add a `confidence` parameter (boolean: `false` for early passes, `true` for stable)
- On stable passes, allow overwriting fields even if already set, IF the new value is different and non-empty
- On early (unstable) passes, keep current behavior (only fill empty fields)

**Update the reactive callback** (line 183):
- Pass the `stable` flag through: `applyProfileData(data, stable)`

### Files changed:
- `src/lib/profileExtractor.ts` — Add `cleanName()`, narrow headline/location scans, fix experience extraction
- `src/components/extension/CandidateForm.tsx` — Allow stable passes to overwrite dirty early values

