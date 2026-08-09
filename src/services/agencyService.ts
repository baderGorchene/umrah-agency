import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AgencySettings } from '../types';
import { initialAgencySettings } from '../mockData';

export const getAgencySettings = async (): Promise<AgencySettings> => {
  if (!isSupabaseConfigured()) {
    return initialAgencySettings;
  }

  try {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Could not fetch agency settings from Supabase, falling back to mock:', error);
      return initialAgencySettings;
    }

    return {
      name: data.name,
      subtitle: data.subtitle,
      description: data.description,
      bannerUrl: data.banner_url,
      logoUrl: data.logo_url,
      address: data.address,
      city: data.city,
      country: data.country,
      phone: data.phone,
      email: data.email,
      licenseNumber: data.license_number,
    };
  } catch (err) {
    console.error('Error fetching agency settings:', err);
    return initialAgencySettings;
  }
};

export const updateAgencySettings = async (settings: AgencySettings): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      name: settings.name,
      subtitle: settings.subtitle,
      description: settings.description,
      banner_url: settings.bannerUrl,
      logo_url: settings.logoUrl,
      address: settings.address,
      city: settings.city,
      country: settings.country,
      phone: settings.phone,
      email: settings.email,
      license_number: settings.licenseNumber,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from('agency_settings').select('id').limit(1).single();

    if (existing?.id) {
      const { error } = await supabase
        .from('agency_settings')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('agency_settings').insert([payload]);
      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error('Failed to update agency settings in Supabase:', err);
    return false;
  }
};
