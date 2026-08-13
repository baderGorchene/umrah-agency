// Supabase Edge Function: auto_crop_photo
// Trigger: Storage object "finalized" webhook
// Purpose: on new passport page upload, create a photo-extraction job (row in pilgrim_photo_extractions)
// and (future) run detection/cropping entirely inside the Edge Function using WASM libs (OpenCV/Tesseract/TFJS).

// NOTE: This is a fully-contained Edge Function scaffold that:
// 1) Accepts Supabase storage webhook events (object finalization)
// 2) Downloads the uploaded object using a signed URL
// 3) Inserts a documents row if needed and creates a pilgrim_photo_extractions job (status = 'pending')
// 4) Returns 200
// TODO: integrate a WASM-based face detector + OpenCV/Tesseract flows to perform detection & crop inside this function

// Environment variables expected (set via Supabase project settings):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (used for DB writes / signed URLs)

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment. Function will fail without them.');
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const event = await req.json();

    // Supabase Storage webhook sends an object with "bucket", "name", and "metageneration" etc under "record" or similar.
    // Support both direct storage events and the wrapper used by Supabase.
    const payload = event?.record ?? event?.payload ?? event;

    const bucket = payload?.bucket;
    const objectKey = payload?.name || payload?.path || payload?.key;

    if (!bucket || !objectKey) {
      console.error('Missing bucket or object key in payload', { payload });
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    // Optional: pilgrim_id if client set metadata (e.g., metadata: { pilgrim_id: '...' })
    const metadata = payload?.metadata ?? {};
    const pilgrimId = metadata?.pilgrim_id ?? null;

    // 1) Create a signed URL to download the uploaded image
    // Using the service role key for authorization to Storage REST API
    // Supabase Storage download URL: ${SUPABASE_URL}/storage/v1/object/public/{bucket}/{path} for public, or use /object/sign to create signed URL.

    // We'll call the storage "sign" endpoint to get an expiring URL
    const signUrl = `${SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(bucket)}/object/sign/${encodeURIComponent(objectKey)}`;

    const signResp = await fetch(signUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: 60 })
    });

    if (!signResp.ok) {
      const text = await signResp.text();
      console.error('Failed to sign object URL', signResp.status, text);
      return new Response(JSON.stringify({ error: 'Failed to sign object URL' }), { status: 500 });
    }

    const { signedURL } = await signResp.json();
    if (!signedURL) {
      console.error('No signedURL returned from storage sign endpoint', { signRespBody: await signResp.text() });
      return new Response(JSON.stringify({ error: 'No signed URL' }), { status: 500 });
    }

    // 2) Download the bytes
    const fileResp = await fetch(signedURL);
    if (!fileResp.ok) {
      console.error('Failed to download object', fileResp.status);
      return new Response(JSON.stringify({ error: 'Failed to download object' }), { status: 500 });
    }

    const fileArrayBuffer = await fileResp.arrayBuffer();
    const fileBytes = new Uint8Array(fileArrayBuffer);

    // For now: Save document metadata in documents table, and create pilgrim_photo_extractions job with status 'pending'
    // 3) Insert document row and photo extraction row via Supabase REST/SQL using service role key

    // Insert into documents. We don't include file_url here (could set to signedURL or storage path)
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        pilgrim_id: pilgrimId,
        file_name: objectKey.split('/').pop(),
        file_path: objectKey,
        file_url: null,
        mime_type: payload?.content_type ?? null,
        ocr_data: null
      })
    });

    if (!insertResp.ok) {
      const txt = await insertResp.text();
      console.error('Failed to insert document row', insertResp.status, txt);
      return new Response(JSON.stringify({ error: 'DB insert failed' }), { status: 500 });
    }

    const insertedDocs = await insertResp.json();
    const documentId = insertedDocs?.[0]?.id ?? null;

    // 4) Create photo extraction job row
    const insertExtractionResp = await fetch(`${SUPABASE_URL}/rest/v1/pilgrim_photo_extractions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        pilgrim_id: pilgrimId,
        document_id: documentId,
        original_bucket: bucket,
        original_path: objectKey,
        status: 'pending',
        notes: 'Created by storage webhook'
      })
    });

    if (!insertExtractionResp.ok) {
      const txt = await insertExtractionResp.text();
      console.error('Failed to insert photo extraction row', insertExtractionResp.status, txt);
      return new Response(JSON.stringify({ error: 'DB insert failed' }), { status: 500 });
    }

    const insertedRows = await insertExtractionResp.json();
    const extractionId = insertedRows?.[0]?.id ?? null;

    // 5) TODO: Run in-function processing pipeline to detect & crop the passport photo
    // - Use WASM builds of OpenCV + Tesseract + TFJS (blazeface) or other WASM models
    // - Steps:
    //   * Deskew / detect document corners -> warpPerspective
    //    * Run face detector on warped image
    //   * If face found with good confidence -> expand bbox, align using landmarks -> create crop
    //   * Upload crop to crops bucket (signed PUT or storage upload endpoint)
    //   * Update pilgrim_photo_extractions row with crop_bucket, crop_path, bbox, confidence, status='done'
    // If processing fails or confidence low -> update row with status='manual_review' and include notes

    // For now we return the job id and leave status as pending for a separate processor (or to add processing later inside this function)

    return new Response(JSON.stringify({ ok: true, documentId, extractionId }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Unhandled function error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
