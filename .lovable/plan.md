

# Rewrite Profile Extractor: Reactive Multi-Strategy Architecture

## What's broken and why

1. **Profile autofill fails** because `extractProfileDataWithRetry` waits 800ms before even the first attempt, then relies on CSS class selectors (`.text-body-medium`, `.pvs-entity`, `h1[class*="text-heading"]`) that LinkedIn has changed. No MutationObserver, no reactive retry.

2. **Duplicate detection ("Already in GoGio" banner)** depends on `linkedinUrl` being set (line 292 dependency array). If autofill fails to populate `linkedinUrl`, lookup never fires. The banner UI exists (lines 540-599) and works -- it just never gets triggered because the LinkedIn URL never gets set from the broken extractor.

## Plan

### File 1: `src/lib/profileExtractor.ts` -- Full rewrite of extraction logic

**Replace the entire extraction approach** with a multi-strategy, reactive architecture:

#### A. Multi-strategy field extractors (replace `getTextFromSelectors`)

Each field gets a list of strategies ordered by stability. Each returns `{ value, source, confidence }`. Pick highest-confidence non-null result.

**fullName strategies:**
1. `document.title` -- LinkedIn titles are "FirstName LastName - Headline | LinkedIn". Parse before the first " - " or " | ". Confidence: 0.8
2. `main h1` -- first h1 inside `<main>`. Confidence: 0.9
3. Any `h1` on page that looks name-like (2-5 words, no special chars). Confidence: 0.6
4. `meta[property="og:title"]` or `meta[name="title"]`. Confidence: 0.7
5. Profile slug from URL (`/in/john-doe/` → "John Doe"). Confidence: 0.4

**headline strategies:**
1. First sibling div/span of the h1 containing text > 10 chars. Confidence: 0.8
2. `meta[name="description"]` or `og:description` -- parse first sentence. Confidence: 0.6
3. `document.title` -- text between first " - " and " | ". Confidence: 0.7

**location strategies:**
1. Walk text elements near the h1/headline area, filter with existing `looksLikeLocation()`. Confidence: 0.7
2. `meta` geo tags if present. Confidence: 0.5

**currentCompany strategies:**
1. `a[href*="/company/"]` nearest to the top of the page (first one in `main`). Get its visible text. Confidence: 0.8
2. Experience section: find section with heading containing "Experience" (multi-locale: "Experiencia", "Expérience", "Erfahrung"), get first `li`, extract non-bold text. Confidence: 0.7
3. Parse headline for "at Company" / "@ Company" patterns. Confidence: 0.5

**currentRole strategies:**
1. Experience section first `li` bold text. Confidence: 0.7
2. Headline parse for role portion. Confidence: 0.5

**profileUrl:**
1. `window.location.href` -- always available. Clean trailing overlay paths.

#### B. Reactive extraction with MutationObserver (replace `extractProfileDataWithRetry`)

New exported function: `createReactiveExtractor(callback, abortSignal)`

```text
┌──────────────────┐
│  URL change       │──→ cancel previous session
│  (SPA navigate)   │──→ start new session
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Retry schedule:   │
│ 0, 150, 400,     │
│ 900, 1800 ms     │──→ run extractAll()
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ MutationObserver  │
│ on <main>         │──→ debounced (500ms) extractAll()
│ auto-disconnect   │
│ after 10s         │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Stability check   │
│ - core fields set │
│ - 2 consecutive   │
│   passes match    │
└──────────────────┘
         │
         ▼
  callback(data)
```

- Keep `extractProfileData()` (synchronous, single-pass) for backward compatibility with the popup message handler
- Add `extractProfileDataReactive(onResult, signal)` for the sidebar
- The MutationObserver watches `document.querySelector('main') || document.body`
- Auto-disconnects after 10 seconds to avoid performance drain
- Stability: two consecutive extractions with matching `fullName` = stable

#### C. Keep existing helpers

- `looksLikeLocation()` -- still useful
- `parseHeadlineForRoleCompany()` -- becomes one strategy
- `extractContactInfo()` -- unchanged (modal-based, different flow)
- `isLinkedInProfilePage()` -- unchanged
- `waitForElement()` -- unchanged

### File 2: `src/components/extension/CandidateForm.tsx`

Two changes:

1. **Replace `extractProfileDataWithRetry` call** (lines 178-184) with `extractProfileDataReactive`:
   - Use the new reactive API with an `AbortController` signal
   - Callback updates form fields progressively as extraction stabilizes
   - Cancel on unmount via cleanup function

2. **Expand lookup trigger** (line 292): change dependency from `[linkedinUrl]` to `[linkedinUrl, email]`, add guard that email must contain `@` before triggering lookup via email.

### File 3: `src/content/linkedinContent.ts`

No changes needed. The content script already handles `GET_LINKEDIN_PROFILE_DATA` by calling `extractProfileData()` synchronously, which will benefit from the improved strategies. The reactive extractor is used only in the sidebar context.

### What this does NOT include (future work)

- Remote config for selectors (requires backend endpoint)
- Telemetry/observability (requires analytics pipeline)
- Fixture tests (requires test infrastructure)
- Locale dictionaries beyond basic terms

These are the right next steps but the immediate priority is making extraction work again.

