auto_crop_photo Edge Function

Purpose
- Handle Supabase Storage "object finalized" webhook events for new passport-page uploads.
- Create a document row and a pilgrim_photo_extractions job.
- (Future) Process the image using WASM builds of OpenCV/Tesseract and a TFJS face detector to extract the passport portrait entirely inside the Edge Function and upload the crop to the crops bucket.

How it works now (prototype)
1. The function expects a POST JSON body from the Supabase Storage webhook with fields including `bucket` and `name` (object path). It supports some wrapper payloads used by Supabase.
2. It signs the object with the Storage sign endpoint using the SERVICE_ROLE_KEY and downloads the file bytes.
3. Inserts a row into `documents` and a job into `pilgrim_photo_extractions` with status `pending`.
4. Returns { documentId, extractionId }.

Deploying the function
- Set the following environment variables in Supabase project settings for Edge Functions:
  - SUPABASE_URL (e.g. https://xyz.supabase.co)
  - SUPABASE_SERVICE_ROLE_KEY (service_role key)

- From local machine (Supabase CLI installed):
  supabase functions deploy auto_crop_photo --project-ref <ref>

WASM-based processing (next steps / TODO)
- To run the extraction fully in the Edge Function, add the following inside index.ts and bundle required WASM files into the function:
  - OpenCV.js (WASM build) for document detection, deskewing, and geometric transforms.
  - Tesseract.js (WASM) for MRZ detection as fallback if face detection fails.
  - @tensorflow/tfjs-backend-wasm + @tensorflow-models/blazeface OR a lightweight ONNX/wasm face detector for face detection and landmarks.

- Key points:
  - WASM binaries should be loaded once (warm start) and reused across calls where possible.
  - Keep resource usage conservative; large models may hit function memory/time limits — test with representative images.
  - If processing is heavy, consider breaking into two functions (fast face-detect pass in one; heavier object-detection training in another) or using a queue and longer-lived worker.

Security & access
- The function uses the service role key to write to the database and to sign URLs. Store this key securely in Supabase project settings and do not embed in client code.
- Decide on bucket policies for `originals` vs `crops` (private vs public) and use signed URLs for downloads/uploads as appropriate.

Integration notes
- Wire Supabase Storage webhook (object finalization) to call the function's URL.
- Frontend: upload passport page to `originals/` bucket and include metadata.json with pilgrim_id if available so the function can link to the pilgrim record automatically.

Monitoring & manual-review
- The table `pilgrim_photo_extractions` stores status and confidence. Add a UI for agents to review `manual_review` cases and accept/reject crops.
