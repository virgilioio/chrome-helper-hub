

## Move Resume Attachment to Candidate Information Section

### What changes

Move the "Attach Resume (PDF)" button and the resume status banners (both auto-detected and manual) from their current position below the Notes card up into the **Candidate Information** card, right after the City/Country row.

### File: `src/components/extension/CandidateForm.tsx`

1. **Remove** the resume upload button block (lines 924-961) from its current location below the Notes card
2. **Remove** the auto-detected resume banner (lines 508-537) and manual resume banner (lines 539-567) from their current position at the top of the form
3. **Add all three elements** (auto-detected banner, manual banner, upload button + hidden file input) inside the Candidate Information card (after line 841, right after the City/Country grid and before the closing `</div>` of the card)

This keeps everything resume-related grouped together in the most visible section, right where users are looking at candidate details. The banners will appear inline within the card rather than floating at the top, and the upload button sits naturally alongside the other candidate fields.

### No other files change

Version bump is not needed since this is a UI-only repositioning within the same component.
