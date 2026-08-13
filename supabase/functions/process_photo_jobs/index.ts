// Supabase Edge Function: process_photo_jobs
// Purpose: background worker (invoked manually or via scheduler) to process pending pilgrim_photo_extractions jobs
// This is the "heavy-stage" scaffold. It polls pending jobs, marks them processing, downloads the original image,
// and runs a placeholder processing pipeline. Replace the placeholder with OpenCV/YOLO/Tesseract WASM or an external model.

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

    // Fetch up to N pending jobs
    const listUrl = `${SUPABASE_URL}/rest/v1/pilgrim_photo_extractions?status=eq.pending&select=*&limit=5&order=created_at.asc`;
    const listResp = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY }
    });
    if (!listResp.ok) {
      const txt = await listResp.text();
      console.error('Failed to list pending jobs', listResp.status, txt);
      return new Response(JSON.stringify({ error: 'Failed to list jobs' }), { status: 500 });
    }

    const jobs = await listResp.json();
    if (!jobs || jobs.length === 0) return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200 });

    const results = [];
    for (const job of jobs) {
      try {
        // Mark job as processing
        const updResp = await fetch(`${SUPABASE_URL}/rest/v1/pilgrim_photo_extractions?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing', notes: 'Picked up by process_photo_jobs' })
        });
        if (!updResp.ok) {
          console.error('Failed to update job to processing', job.id, updResp.status, await updResp.text());
          results.push({ id: job.id, status: 'update_failed' });
          continue;
        }

        // Sign original object URL
        const signUrl = `${SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(job.original_bucket)}/object/sign/${encodeURIComponent(job.original_path)}`;
        const signResp = await fetch(signUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: 120 })
        });
        if (!signResp.ok) {
          console.error('Failed to sign original object for job', job.id, await signResp.text());
          await markJobFailed(job.id, 'sign_url_failed');
          results.push({ id: job.id, status: 'sign_failed' });
          continue;
        }
        const { signedURL } = await signResp.json();
        if (!signedURL) {
          await markJobFailed(job.id, 'no_signed_url');
          results.push({ id: job.id, status: 'no_signed_url' });
          continue;
        }

        // Download image bytes
        const fileResp = await fetch(signedURL);
        if (!fileResp.ok) {
          console.error('Failed to download original for job', job.id, fileResp.status);
          await markJobFailed(job.id, 'download_failed');
          results.push({ id: job.id, status: 'download_failed' });
          continue;
        }
        const buf = await fileResp.arrayBuffer();
        const size = buf.byteLength;

        // Placeholder processing: if file size < 10KB mark as failed, otherwise mark for manual_review
        // Replace this block with actual image processing (OpenCV, face detection, object detection)
        if (size < 10_000) {
          await markJobFailed(job.id, 'file_too_small');
          results.push({ id: job.id, status: 'file_too_small' });
          continue;
        }

        // For now: set status to manual_review so human can accept; include debug info
        await fetch(`${SUPABASE_URL}/rest/v1/pilgrim_photo_extractions?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'manual_review', notes: 'Heavy processing placeholder: needs OpenCV/ML integration' })
        });

        results.push({ id: job.id, status: 'manual_review' });

      } catch (err) {
        console.error('Unhandled job processing error', err);
        await markJobFailed(job.id, String(err));
        results.push({ id: job.id, status: 'error' });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Unhandled function error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function markJobFailed(id: string, reason: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/pilgrim_photo_extractions?id=eq.${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'failed', notes: reason })
    });
  } catch (err) {
    console.error('Failed to mark job failed', id, err);
  }
}
