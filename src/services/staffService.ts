import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Staff, Trip, DEFAULT_AVATAR_URL } from "../types";

const TUNISIA_PREFIX = "+216";

/**
 * Ensures a phone/whatsapp number always carries a country prefix.
 * - Already has "+" -> left untouched (any country).
 * - Starts with "00" (international dialing format) -> converted to "+".
 * - No prefix at all -> defaults to Tunisia's +216.
 * Acts as a backstop at the data layer in case a caller (bulk import,
 * future form, etc.) forgets to normalize before calling this service.
 */
export const normalizePhone = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("00")) return `+${trimmed.slice(2)}`;
  return `${TUNISIA_PREFIX}${trimmed}`;
};

export const getStaff = async (trips: Trip[] = []): Promise<Staff[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Could not fetch staff from Supabase:", error);
      return [];
    }

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return data.map((s) => {
      const isUnsplash = s.avatar_url && s.avatar_url.includes("unsplash.com");
      const avatarUrl =
        !s.avatar_url || isUnsplash ? DEFAULT_AVATAR_URL : s.avatar_url;

      return {
        id: s.id,
        nameArabic: s.name_arabic,
        nameLatin: s.name_latin,
        phone: s.phone,
        whatsapp: s.whatsapp,
        role: s.role,
        uniqueCode: s.unique_code,
        tripId: s.trip_id || "",
        tripName: s.trip_id ? tripsMap.get(s.trip_id) || "—" : "—",
        avatarUrl: avatarUrl,
      };
    });
  } catch (err) {
    console.error("Error fetching staff from Supabase:", err);
    return [];
  }
};

export const createStaff = async (
  staffData: Omit<Staff, "id">,
  trips: Trip[] = [],
): Promise<Staff | null> => {
  const normalizedWhatsapp = normalizePhone(staffData.whatsapp);
  const normalizedPhone = normalizePhone(staffData.phone) || normalizedWhatsapp;

  if (!isSupabaseConfigured()) {
    return {
      ...staffData,
      phone: normalizedPhone,
      whatsapp: normalizedWhatsapp,
      id: `staff-${Date.now()}`,
    };
  }

  try {
    const payload = {
      trip_id: staffData.tripId || null,
      name_arabic: staffData.nameArabic,
      name_latin: staffData.nameLatin,
      phone: normalizedPhone,
      whatsapp: normalizedWhatsapp,
      role: staffData.role,
      unique_code: staffData.uniqueCode,
      avatar_url: staffData.avatarUrl,
    };

    const { data, error } = await supabase
      .from("staff")
      .insert([payload])
      .select()
      .single();
    if (error || !data) throw error;

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return {
      id: data.id,
      nameArabic: data.name_arabic,
      nameLatin: data.name_latin,
      phone: data.phone,
      whatsapp: data.whatsapp,
      role: data.role,
      uniqueCode: data.unique_code,
      tripId: data.trip_id || "",
      tripName: data.trip_id ? tripsMap.get(data.trip_id) || "—" : "—",
      avatarUrl: data.avatar_url,
    };
  } catch (err) {
    console.error("Error creating staff in Supabase:", err);
    return null;
  }
};

export const updateStaff = async (staff: Staff): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const normalizedWhatsapp = normalizePhone(staff.whatsapp);
    const normalizedPhone = normalizePhone(staff.phone) || normalizedWhatsapp;

    const payload = {
      trip_id: staff.tripId || null,
      name_arabic: staff.nameArabic,
      name_latin: staff.nameLatin,
      phone: normalizedPhone,
      whatsapp: normalizedWhatsapp,
      role: staff.role,
      avatar_url: staff.avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("staff")
      .update(payload)
      .eq("id", staff.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating staff in Supabase:", err);
    return false;
  }
};

export const deleteStaff = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting staff from Supabase:", err);
    return false;
  }
};
