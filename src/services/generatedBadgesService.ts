import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GeneratedBadgeRecord } from '../types';

const STORAGE_KEY = 'umrah-generated-badges';
const TABLE_NAME = 'badge_generations';

export const saveGeneratedBadges = async (records: GeneratedBadgeRecord[]): Promise<boolean> => {
  if (!records.length) {
    return false;
  }

  const persistedPayload = records.map((record) => ({
    ...record,
    payload: JSON.stringify(record.payload),
  }));

  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...parsed, ...persistedPayload])
    );
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).insert(
      persistedPayload.map((record) => ({
        trip_id: record.tripId,
        trip_name: record.tripName,
        pilgrim_id: record.pilgrimId,
        pilgrim_name: record.pilgrimName,
        unique_code: record.uniqueCode,
        template_id: record.templateId,
        template_name: record.templateName,
        template_variant: record.templateVariant,
        accent_color: record.accentColor,
        guide_1_name: record.guide1Name,
        guide_1_phone: record.guide1Phone,
        guide_2_name: record.guide2Name,
        guide_2_phone: record.guide2Phone,
        payload: record.payload,
        created_at: record.createdAt || new Date().toISOString(),
      }))
    );

    if (error) {
      console.warn(`Could not persist badges to Supabase table ${TABLE_NAME}:`, error);
      return true;
    }

    return true;
  } catch (error) {
    console.warn(`Unexpected error while saving badges to Supabase table ${TABLE_NAME}:`, error);
    return true;
  }
};

export const getGeneratedBadgeCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      return 0;
    }

    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

export const getBadgeGenerationSql = (): string => `
create table if not exists ${TABLE_NAME} (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  trip_name text not null,
  pilgrim_id text not null,
  pilgrim_name text not null,
  unique_code text not null,
  template_id text not null,
  template_name text not null,
  template_variant text not null,
  accent_color text not null,
  guide_1_name text,
  guide_1_phone text,
  guide_2_name text,
  guide_2_phone text,
  payload text not null,
  created_at timestamptz not null default now()
);
`;
