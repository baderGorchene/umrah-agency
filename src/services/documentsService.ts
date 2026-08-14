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
    const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = pilgrimId ? `${pilgrimId}/${cleanFileName}` : `scans/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('passports')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error || !data) {
      console.error('Error uploading passport scan to Supabase storage:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('passports')
      .getPublicUrl(storagePath);

    return {
      filePath: data.path,
      fileUrl: publicUrlData?.publicUrl || '',
    };
  } catch (err) {
    console.error('Storage upload exception:', err);
    return null;
  }
};

/**
 * Uploads/Converts a profile avatar photo to an optimized base64 Data URL.
 * Works immediately without requiring a Supabase Storage bucket.
 */
export const uploadAvatarToStorage = async (
  file: File | Blob,
  _entityId?: string,
  _type: 'pilgrim' | 'staff' = 'pilgrim'
): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (!rawResult) return resolve(null);

      // If it's not an image (e.g. PDF), return the data URL as is
      if (file.type && !file.type.startsWith('image/')) {
        return resolve(rawResult);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 480;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.85);
            resolve(optimized);
          } else {
            resolve(rawResult);
          }
        } catch {
          resolve(rawResult);
        }
      };
      img.onerror = () => resolve(rawResult);
      img.src = rawResult;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
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
