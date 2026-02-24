## Resume Attachment: Status and Improvements

### ✅ Completed (Chrome Extension - v0.2.11)

1. **Manual Resume Upload Button** — Added in `CandidateForm.tsx`
   - Hidden `<input type="file" accept=".pdf">` with ref
   - "Attach Resume (PDF)" dashed button below Notes card (only shown when no resume attached)
   - File read as base64 via `FileReader.readAsArrayBuffer`
   - Purple banner shows filename + "Will attach when you add candidate"
   - On submit, manual resume uploaded same as auto-detected resumes
   - Dismiss button to remove attached resume

2. **Version bumped** to `0.2.11`

### ⏳ Pending (GoGioATS Backend)

3. **Trigger AI Parsing After Resume Upload**
   - **File**: `supabase/functions/chrome-api-gateway/index.ts` (GoGioATS project)
   - After successful resume upload in `handleResume()` (after line 713), add:
     1. Extract text from PDF bytes using a simple text decoder (or use pdf-parse library)
     2. Fire-and-forget call to `enrich-candidate-profile` with `candidateId` + extracted text
   - Example code to add after `console.log('✅ Chrome API /resume - Success:')`:
   ```typescript
   // Fire-and-forget: trigger AI enrichment
   try {
     // Simple PDF text extraction from bytes
     const textDecoder = new TextDecoder('utf-8', { fatal: false });
     const rawText = textDecoder.decode(fileBytes);
     // Extract readable text between stream markers
     const textParts: string[] = [];
     const streamRegex = /stream\s*\n([\s\S]*?)endstream/g;
     let match;
     while ((match = streamRegex.exec(rawText)) !== null) {
       const content = match[1].replace(/[^\x20-\x7E\n\r]/g, ' ').trim();
       if (content.length > 10) textParts.push(content);
     }
     const extractedText = textParts.join('\n').slice(0, 15000);
     
     if (extractedText.length > 50) {
       supabase.functions.invoke('enrich-candidate-profile', {
         body: {
           candidateId: candidate_id,
           resumeText: extractedText,
           candidateName: null, // Could query candidate name if needed
         }
       }).catch(err => console.error('Background enrichment failed:', err));
       console.log('🧠 Triggered background AI enrichment for candidate:', candidate_id);
     }
   } catch (enrichErr) {
     console.error('Failed to trigger enrichment:', enrichErr);
   }
   ```
   - **Note**: The simple regex-based PDF text extraction may not work for all PDFs. For better results, consider using a PDF parsing library like `pdf-parse` or storing the raw text on the client side and sending it with the resume upload.
