process_photo_jobs Edge Function

Purpose
- Background worker to process pending pilgrim_photo_extractions jobs created by the storage webhook Edge Function (auto_crop_photo).
- Intended for the heavy-stage processing (OpenCV deskew, trained object detector, MRZ OCR fallback, segmentation).

How it works now (scaffold)
- When invoked (HTTP GET/POST), it queries the database for up to 5 jobs with status = 'pending'.
- Marks each job as processing, signs and downloads the original image, and runs a placeholder check.
- If image size is too small or download/sign fails, job is marked 'failed'. Otherwise it's marked 'manual_review' with notes indicating the heavy pipeline still needs integration.

Next steps to integrate the heavy pipeline
- Replace the placeholder block with the heavy processing algorithm (OpenCV native via native build, or WASM builds inside Edge Functions):
  1. Detect and warp the document page to a normalized rectangle.
  2. Run an object detector (YOLO/Detectron) trained to find the passport photo box OR run a face detector to find the face and crop.
  3. Validate crop and upload to the crops bucket using Storage signed upload endpoint.
  4. Update the job row with crop_bucket, crop_path, bbox, confidence, and status = 'done' or 'manual_review'.

Deployment
- Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Edge Function environment variables.
- Deploy with Supabase CLI:
  supabase functions deploy process_photo_jobs --project-ref <ref>

Invocation
- Manually: call the function's URL (POST or GET) to process pending jobs.
- Scheduler: set up an external cron (e.g., GitHub Actions, Cloud Scheduler) to invoke this function periodically.

Notes on execution environment
- Edge Functions have CPU/memory and duration limits. If the heavy pipeline requires more resources, consider a separate worker host (Cloud Run, Lambda with more memory) and keep orchestration in Supabase (DB job rows).
- Use the database job table to track progress and to store debug artifacts for failed/manual-review cases.
