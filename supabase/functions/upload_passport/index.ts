// Supabase Edge Function: upload_passport
// Purpose: receives a base64 file payload from the client and uploads it to the 'passports' bucket using the service role key.
// This avoids client-side RLS restrictions on storage.objects.

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TARGET_BUCKET = 'passports';

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await req.json();
    const { fileBase64, fileName, pilgrimId, mimeType } = body;

    if (!fileBase64 || !fileName) return new Response(JSON.stringify({ error: 'Missing payload' }), { status: 400 });

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in function environment');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    }

    // Normalize file name
    const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = pilgrimId ? `${pilgrimId}/${cleanFileName}` : `scans/${cleanFileName}`;

    // Decode base64 (data URL may include prefix)
    const base64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Upload via Storage REST API using service role key. Use PUT to the object path.
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(TARGET_BUCKET)}/${encodeURIComponent(storagePath)}`;

    const uploadResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': mimeType || 'application/octet-stream',
      },
      body: bytes,
    });

    if (!uploadResp.ok) {
      const txt = await uploadResp.text();
      console.error('Failed to upload to storage', uploadResp.status, txt);
      return new Response(JSON.stringify({ error: 'Storage upload failed', details: txt }), { status: 500 });
    }

    // Create a signed URL for download (short lived) using sign endpoint
    const signUrl = `${SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(TARGET_BUCKET)}/object/sign/${encodeURIComponent(storagePath)}`;
    const signResp = await fetch(signUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 60 }),
    });

    let signedURL = null;
    if (signResp.ok) {
      const json = await signResp.json();
      signedURL = json?.signedURL ?? json?.signedURL;
    }

    return new Response(JSON.stringify({ ok: true, filePath: storagePath, fileUrl: signedURL }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unhandled upload_passport error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
