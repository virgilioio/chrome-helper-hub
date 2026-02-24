

## Resume Attachment: Status and Improvements

### Current State

**What works:**
- Auto-detect LinkedIn PDF download (background.js detects it, stores metadata)
- Purple banner shows in sidebar: "filename.pdf - Will attach when you add candidate"
- On form submit, the PDF is read as base64 and uploaded to GoGioATS storage
- The file appears in the candidate's attachments in the GoGioATS app

**What's missing:**
1. No manual file upload button -- users can ONLY attach resumes via the auto-download detection
2. AI parsing (skills extraction, profile summary) is NOT triggered after Chrome extension upload -- the `parse-resume` and `enrich-candidate-profile` edge functions are only called from the GoGioATS web app UI, not automatically after the Chrome extension uploads

### Proposed Changes

#### 1. Add Manual Resume Upload Button (Chrome Extension)

Add a file input button in `CandidateForm.tsx` that lets users pick a PDF manually, creating the same pending resume state as the auto-detection flow.

**File: `src/components/extension/CandidateForm.tsx`**
- Add a hidden `<input type="file" accept=".pdf">` element
- Add an "Attach Resume" button (styled like the Fetch Contact button) below the Notes card
- When a file is selected, read it as base64, store it in component state as a "manual resume"
- On submit, upload it the same way as auto-detected resumes
- Show the same purple banner when a manual resume is queued

#### 2. Trigger AI Parsing After Resume Upload (Backend)

After the Chrome extension uploads a resume, the gateway should trigger the `parse-resume` and `enrich-candidate-profile` edge functions automatically.

**File: `supabase/functions/chrome-api-gateway/index.ts`** (in the GoGioATS project)
- After successful resume upload in `handleResume()`, invoke `parse-resume` and `enrich-candidate-profile` in a fire-and-forget pattern
- This ensures skills, work experience, education, and AI summary are extracted just like when uploading from the web app

#### 3. Version Bump

**File: `public/manifest.json`**
- Bump version to `0.2.11`

### Technical Details

**Manual upload approach:**
- Use a `useRef<HTMLInputElement>` for the hidden file input
- On file select, read the file using `FileReader.readAsArrayBuffer`, convert to base64
- Store `{ filename, data, size }` in component state
- The submit handler already supports resume upload -- we just need to feed it the manual file data instead of calling `readDownloadedFile()`
- The purple banner component already exists and just needs to respond to the manual resume state too

**AI parsing trigger (GoGioATS side):**
- After the `candidate_attachments` insert succeeds, extract text from the PDF using the existing `parse-resume` function
- Then call `enrich-candidate-profile` with the parsed text to generate skills, summary, etc.
- Both calls should be fire-and-forget (non-blocking) so the extension gets an immediate response
- Uses `fetch()` to invoke the Supabase functions internally from the gateway

### Changes Summary

| File | Project | Change |
|------|---------|--------|
| `src/components/extension/CandidateForm.tsx` | Chrome Extension | Add manual "Attach Resume" file picker button |
| `supabase/functions/chrome-api-gateway/index.ts` | GoGioATS | Trigger parse-resume + enrich after upload |
| `public/manifest.json` | Chrome Extension | Bump to 0.2.11 |

