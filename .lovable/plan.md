

# Add `location_state` field to Chrome Extension

## Changes

### 1. `src/lib/api.ts` (line 44)
Add `location_state: string` between `location_city` and `location_country` in the `CandidatePayload` interface.

### 2. `src/components/extension/CandidateForm.tsx`

**New state** (after line 96):
- Add `const [state, setState] = useState('');`

**Location parsing** (lines 261-269) — replace with 3-part handling:
- 3 parts (`"City, State, Country"`) → city, state, country
- 2 parts (`"City, Country"`) → city, country (state empty)
- 1 part → country only

**Location grid UI** (lines 884-912) — change from 2-column to 3-column grid:
- City | State/Region | Country
- State field uses a generic label like "State / Region"

**Submission payload** (line 358) — add `location_state: state.trim()` between `location_city` and `location_country`.

**Reset** — if there's a form reset function, include `setState('')`.

Raw LinkedIn text is sent as-is; backend handles normalization.

