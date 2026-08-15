import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AgencySettings } from '../types';
import { initialAgencySettings } from '../mockData';

const SETTINGS_CACHE_KEY = 'umrah_agency_settings_cache';

const sanitizeUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('unsplash.com')) return '';
  return url;
};

export const getAgencySettings = async (): Promise<AgencySettings> => {
  // Read local cache first for instant fallback
  let cachedSettings: AgencySettings = initialAgencySettings;
  try {
    const local = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      cachedSettings = {
        ...initialAgencySettings,
        ...parsed,
        bannerUrl: sanitizeUrl(parsed.bannerUrl),
        logoUrl: sanitizeUrl(parsed.logoUrl),
      };
    }
  } catch (e) {
    console.warn('Failed to read cached agency settings:', e);
  }

  if (!isSupabaseConfigured()) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.warn('Could not fetch agency settings from Supabase:', error);
      return cachedSettings;
    }

    const fetched: AgencySettings = {
      name: data.name ?? cachedSettings.name,
      subtitle: data.subtitle ?? cachedSettings.subtitle ?? '',
      description: data.description ?? cachedSettings.description ?? '',
      bannerUrl: sanitizeUrl(data.banner_url ?? cachedSettings.bannerUrl ?? ''),
      logoUrl: sanitizeUrl(data.logo_url ?? cachedSettings.logoUrl ?? ''),
      address: data.address ?? cachedSettings.address ?? '',
      city: data.city ?? cachedSettings.city ?? '',
      country: data.country ?? cachedSettings.country ?? 'Tunisie',
      phone: data.phone ?? cachedSettings.phone ?? '',
      email: data.email ?? cachedSettings.email ?? '',
      licenseNumber: data.license_number ?? cachedSettings.licenseNumber ?? '',
      governorate: data.governorate ?? cachedSettings.governorate ?? '',
      themeColor: data.theme_color ?? cachedSettings.themeColor ?? 'emerald',
      customColor: data.custom_color ?? cachedSettings.customColor ?? '#0A5C36',
      defaultLang: data.default_lang ?? cachedSettings.defaultLang ?? 'fr',
    };

    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(fetched));
    } catch {
      // ignore
    }

    return fetched;
  } catch (err) {
    console.error('Error fetching agency settings:', err);
    return cachedSettings;
  }
};

export const updateAgencySettings = async (settings: AgencySettings): Promise<boolean> => {
  // Always update local cache for instant UI feedback
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      name: settings.name,
      subtitle: settings.subtitle || '',
      description: settings.description || '',
      banner_url: settings.bannerUrl || '',
      logo_url: settings.logoUrl || '',
      address: settings.address || '',
      city: settings.city || '',
      governorate: settings.governorate || '',
      country: settings.country || 'Tunisie',
      phone: settings.phone || '',
      email: settings.email || '',
      license_number: settings.licenseNumber || '',
      theme_color: settings.themeColor || 'emerald',
      custom_color: settings.customColor || '#0A5C36',
      default_lang: settings.defaultLang || 'fr',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('agency_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('agency_settings')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('agency_settings')
        .insert([payload]);
      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error('Failed to update agency settings in Supabase:', err);
    return false;
  }
};

/**
 * Uploads an agency image (logo or banner) to Supabase Storage 'agency-assets' bucket.
 * Falls back to an optimized base64 Data URL if bucket is not configured or fails.
 */
export const uploadAgencyImage = async (
  file: File | Blob,
  type: 'logo' | 'banner'
): Promise<string | null> => {
  // 1. If Supabase is configured, try uploading directly to Supabase Storage bucket 'agency-assets'
  if (isSupabaseConfigured()) {
    try {
      const ext = file instanceof File && file.name.includes('.') ? file.name.split('.').pop() : 'png';
      const cleanFileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const storagePath = `${type}s/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('agency-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('agency-assets')
          .getPublicUrl(storagePath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn(`Supabase storage bucket 'agency-assets' upload returned error (using optimized fallback):`, error);
      }
    } catch (err) {
      console.warn('Storage upload exception (using fallback):', err);
    }
  }

  // 2. Client-side canvas compression fallback to produce a fast base64 string
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (!rawResult) return resolve(null);

      // Non-images (e.g. SVG or raw data)
      if (file.type && !file.type.startsWith('image/')) {
        return resolve(rawResult);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = type === 'banner' ? 1200 : 400;
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
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const optimized = canvas.toDataURL(mime, 0.88);
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
