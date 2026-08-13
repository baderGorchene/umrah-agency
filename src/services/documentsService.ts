import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExtractedPassportData } from '../components/PassportScannerModal';

export interface DocumentRecord {
  id: string;
  pilgrimId?: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
  mimeType?: string;
  ocrData?: ExtractedPassportData;
  createdAt: string;
}


/**
 * Uploads passport file (Image or PDF) to Supabase Storage bucket 'passports'
 */
export const uploadPassportToStorage = async (
  file: File | Blob,
  fileName: string,
  pilgrimId?: string
): Promise<{ filePath: string; fileUrl: string } | null> => {
  if (!isSupabaseConfigured()) {
    return {
      filePath: `passports/mock/${fileName}`,
      fileUrl: URL.createObjectURL(file),
    };
  }

  try {
    // Convert file to base64 Data URL
    const toBase64 = (f: File | Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f as Blob);
      });

    const fileBase64 = await toBase64(file);

    // Call Supabase Edge Function to perform server-side upload using service role key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const funcUrl = `${supabaseUrl}/functions/v1/upload_passport`;

    const resp = await fetch(funcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64, fileName, pilgrimId, mimeType: (file as File).type || 'image/jpeg' }),
    });

    const json = await resp.json();
    if (!resp.ok || !json?.ok) {
      console.error('Server-side upload failed', json);
      return null;
    }

    return { filePath: json.filePath, fileUrl: json.fileUrl };
  } catch (err) {
    console.error('Storage upload exception:', err);
    return null;
  }
};

/**
 * Uploads a profile avatar photo to Supabase Storage bucket 'avatars'
 * If Supabase is not configured, converts to base64 Data URL.
 */
export const uploadAvatarToStorage = async (
  file: File | Blob,
  entityId: string,
  type: 'pilgrim' | 'staff' = 'pilgrim'
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `${type}_${entityId}_${Date.now()}.${fileExt}`;
    const storagePath = `${type}s/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error || !data) {
      console.error('Error uploading avatar to Supabase storage:', error);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(storagePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Avatar upload exception:', err);
    return null;
  }
};

/**
 * Saves extracted document & OCR payload to Supabase PostgreSQL table 'documents'
 */
export const saveDocumentRecord = async (doc: {
  pilgrimId?: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
  mimeType?: string;
  ocrData?: ExtractedPassportData;
}): Promise<DocumentRecord | null> => {
  if (!isSupabaseConfigured()) {
    return {
      id: `doc-${Date.now()}`,
      ...doc,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const payload = {
      pilgrim_id: doc.pilgrimId || null,
      file_name: doc.fileName,
      file_path: doc.filePath,
      file_url: doc.fileUrl,
      mime_type: doc.mimeType || 'image/jpeg',
      ocr_data: doc.ocrData || null,
    };

    const { data, error } = await supabase.from('documents').insert([payload]).select().single();
    if (error || !data) throw error;

    return {
      id: data.id,
      pilgrimId: data.pilgrim_id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileUrl: data.file_url,
      mimeType: data.mime_type,
      ocrData: data.ocr_data,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error saving document record to Supabase Postgres:', err);
    return null;
  }
};
