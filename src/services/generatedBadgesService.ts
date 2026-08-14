import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { GeneratedBadgeRecord } from "../types";

const STORAGE_KEY = "umrah-generated-badges";
const TABLE_NAME = "badge_generations";

type GeneratedBadgeStorageItem = Omit<GeneratedBadgeRecord, "payload"> & {
  payload: string;
};

const parseGeneratedBadgeItem = (
  item: unknown,
): GeneratedBadgeRecord | null => {
  if (!item || typeof item !== "object") return null;

  const parsed = item as GeneratedBadgeStorageItem;
  let payload: Record<string, unknown> = {};

  try {
    payload =
      typeof parsed.payload === "string"
        ? JSON.parse(parsed.payload)
        : parsed.payload;
  } catch {
    payload =
      typeof parsed.payload === "object" && parsed.payload
        ? parsed.payload
        : {};
  }

  return {
    ...parsed,
    payload,
  };
};

export const saveGeneratedBadges = async (
  records: GeneratedBadgeRecord[],
): Promise<boolean> => {
  if (!records.length) {
    return false;
  }

  const persistedPayload = records.map((record) => ({
    ...record,
    payload: JSON.stringify(record.payload),
  }));

  if (typeof window !== "undefined") {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...parsed, ...persistedPayload]),
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
      })),
    );

    if (error) {
      console.warn(
        `Could not persist badges to Supabase table ${TABLE_NAME}:`,
        error,
      );
      return true;
    }

    return true;
  } catch (error) {
    console.warn(
      `Unexpected error while saving badges to Supabase table ${TABLE_NAME}:`,
      error,
    );
    return true;
  }
};

export const getGeneratedBadges = (): GeneratedBadgeRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) return [];

    const parsed = JSON.parse(existing);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseGeneratedBadgeItem)
      .filter((record): record is GeneratedBadgeRecord => record !== null);
  } catch {
    return [];
  }
};

export const findGeneratedBadgeByCode = (
  uniqueCode: string,
): GeneratedBadgeRecord | null => {
  return (
    getGeneratedBadges().find((record) => record.uniqueCode === uniqueCode) ||
    null
  );
};

export const getGeneratedBadgeByCode = async (
  uniqueCode: string,
): Promise<GeneratedBadgeRecord | null> => {
  if (!isSupabaseConfigured()) return null;

  const normCode = uniqueCode.trim().toUpperCase();

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .ilike("unique_code", normCode) // 👈 Using ilike for case-insensitive matching
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error)
        console.warn("Supabase query error on badge_generations:", error);
      return null;
    }

    let payloadObj: Record<string, unknown> = {};
    try {
      payloadObj =
        typeof data.payload === "string"
          ? JSON.parse(data.payload)
          : data.payload || {};
    } catch {
      payloadObj = {};
    }

    return {
      id: data.id,
      tripId: data.trip_id,
      tripName: data.trip_name,
      pilgrimId: data.pilgrim_id,
      pilgrimName: data.pilgrim_name,
      uniqueCode: data.unique_code,
      templateId: data.template_id,
      templateName: data.template_name,
      templateVariant: data.template_variant,
      accentColor: data.accent_color,
      guide1Name: data.guide_1_name || "",
      guide1Phone: data.guide_1_phone || "",
      guide2Name: data.guide_2_name || "",
      guide2Phone: data.guide_2_phone || "",
      payload: payloadObj,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn("Error querying badge_generations for code", normCode, err);
    return null;
  }
};

export const getGeneratedBadgeCount = (): number => {
  if (typeof window === "undefined") {
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
