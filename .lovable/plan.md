

# Fix: Pronouns Leaking into Location Field

## Problem
The `looksLikeLocation()` function in `profileExtractor.ts` doesn't filter out pronoun text like "(He/Him)", "(She/Her)", etc. These short strings pass all current checks and get matched by the near-h1 scan (Strategy 1 in `extractLocationField`), ending up in the City field after comma-splitting.

## State Field UI
The State/Region field is **already implemented** — 3-column grid with City, State/Region, Country is in place (line 894). No UI changes needed.

## Fix: `src/lib/profileExtractor.ts`

**`looksLikeLocation()` (line 54-61)** — Add a pronoun/parenthetical filter:
- Reject text matching pronoun patterns: `/(he|him|she|her|they|them|ze|hir)/i` when wrapped in parentheses
- Reject any text that is entirely wrapped in parentheses (these are never locations)
- Add to the existing blocklist regex: pronouns pattern

**`extractLocationField()` Strategy 1 (line 289)** — Add additional guard:
- Skip elements whose text starts with `(` (parenthetical annotations are never locations)

Two small additions, no structural changes needed.

