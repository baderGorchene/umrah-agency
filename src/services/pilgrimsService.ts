import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import { initialPilgrims } from "../mockData";

export const normalizeAvatarUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || rawUrl.trim() === "") return DEFAULT_AVATAR_URL;
  const trimmed = rawUrl.trim();
  if (trimmed.includes("unsplash.com")) return DEFAULT_AVATAR_URL;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (isSupabaseConfigured()) {
    try {
      const cleanPath = trimmed.startsWith("avatars/") ? trimmed.replace(/^avatars\//, "") : trimmed;
      const { data } = supabase.storage.from("avatars").getPublicUrl(cleanPath);
      if (data?.publicUrl) return data.publicUrl;
    } catch {
      // ignore
    }
  }
  return trimmed;
};

export const getPilgrims = async (trips: Trip[] = []): Promise<Pilgrim[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("pilgrims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn(
        "Could not fetch pilgrims from Supabase:",
        error,
      );
      return [];
    }

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return data.map((p: any) => {
      const rawAvatar = p.avatar_url || p.avatarUrl || p.photo_url || p.image_url;
      const avatarUrl = normalizeAvatarUrl(rawAvatar);

      return {
        id: p.id,
        nameArabic: p.name_arabic || p.nameArabic || "معتمر",
        nameLatin: p.name_latin || p.nameLatin,
        phone: p.phone || "",
        tripId: p.trip_id || p.tripId || "",
        tripName: (p.trip_id ? tripsMap.get(p.trip_id) : undefined) || "—",
        uniqueCode: p.unique_code || p.uniqueCode || "",
        status: p.status || "في الانتظار",
        passportNumber: p.passport_number || p.passportNumber,
        avatarUrl: avatarUrl,
        emergencyContact: p.emergency_contact || p.emergencyContact,
        gender: p.gender,
        birthDate: p.birth_date || p.birthDate,
      };
    });
  } catch (err) {
    console.error("Error fetching pilgrims from Supabase:", err);
    return [];
  }
};

export const createPilgrim = async (
  pilgrimData: Omit<Pilgrim, "id">,
  trips: Trip[] = [],
): Promise<Pilgrim | null> => {
  if (!isSupabaseConfigured()) {
    return { ...pilgrimData, id: `pilgrim-${Date.now()}` };
  }

  try {
    const isValidUUID = (s: any) =>
      typeof s === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        s,
      );
    const tripId = isValidUUID(pilgrimData.tripId) ? pilgrimData.tripId : null;

    const payload = {
      trip_id: tripId,
      name_arabic: pilgrimData.nameArabic,
      name_latin: pilgrimData.nameLatin,
      phone: pilgrimData.phone,
      unique_code: pilgrimData.uniqueCode,
      status: pilgrimData.status,
      passport_number: pilgrimData.passportNumber,
      avatar_url: pilgrimData.avatarUrl,
      emergency_contact: pilgrimData.emergencyContact,
      gender: pilgrimData.gender,
      birth_date: pilgrimData.birthDate,
    };

    const { data, error } = await supabase
      .from("pilgrims")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    if (!data) return null;

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return {
      id: data.id,
      nameArabic: data.name_arabic,
      nameLatin: data.name_latin,
      phone: data.phone,
      tripId: data.trip_id || "",
      tripName: data.trip_id ? tripsMap.get(data.trip_id) || "—" : "—",
      uniqueCode: data.unique_code,
      status: data.status,
      passportNumber: data.passport_number,
      avatarUrl: data.avatar_url,
      emergencyContact: data.emergency_contact,
      gender: data.gender,
      birthDate: data.birth_date,
    };
  } catch (err) {
    console.error("Error creating pilgrim in Supabase:", err);
    return null;
  }
};

export const updatePilgrim = async (pilgrim: Pilgrim): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    // 1. Validate UUID check to prevent PostgreSQL syntax error
    const isValidUUID = (s: any) =>
      typeof s === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        s,
      );
    const tripId = isValidUUID(pilgrim.tripId) ? pilgrim.tripId : null;

    const payload = {
      trip_id: tripId, // 👈 Ensures valid UUID or null
      name_arabic: pilgrim.nameArabic,
      name_latin: pilgrim.nameLatin,
      phone: pilgrim.phone,
      status: pilgrim.status,
      passport_number: pilgrim.passportNumber,
      avatar_url: pilgrim.avatarUrl,
      emergency_contact: pilgrim.emergencyContact,
      gender: pilgrim.gender,
      birth_date: pilgrim.birthDate,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("pilgrims")
      .update(payload)
      .eq("id", pilgrim.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating pilgrim in Supabase:", err);
    return false;
  }
};

export const deletePilgrim = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from("pilgrims").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting pilgrim from Supabase:", err);
    return false;
  }
};

export const getPilgrimByUniqueCode = async (
  uniqueCode: string,
): Promise<Pilgrim | null> => {
  const normCode = uniqueCode.trim().toUpperCase();
  console.log("🔍 [pilgrimsService] getPilgrimByUniqueCode requested for code:", normCode);

  if (isSupabaseConfigured()) {
    try {
      console.log("📡 [Supabase] Querying pilgrims table with unique_code ilike:", normCode);
      let { data, error } = await supabase
        .from("pilgrims")
        .select("*")
        .ilike("unique_code", normCode)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("🔴 [Supabase] Query error on unique_code:", error);
      }

      // If not found by unique_code, try matching passport_number
      if (!data) {
        console.log("📡 [Supabase] Trying secondary query with passport_number ilike:", normCode);
        const passportRes = await supabase
          .from("pilgrims")
          .select("*")
          .ilike("passport_number", normCode)
          .limit(1)
          .maybeSingle();
        if (passportRes.data) {
          data = passportRes.data;
          console.log("✅ [Supabase] Pilgrim matched via passport_number:", data.name_arabic);
        } else if (passportRes.error) {
          console.error("🔴 [Supabase] Secondary query error:", passportRes.error);
        }
      }

      if (data) {
        console.log("✅ [Supabase] Found pilgrim record in database:", {
          id: data.id,
          name_arabic: data.name_arabic,
          unique_code: data.unique_code,
          has_avatar: Boolean(data.avatar_url),
          avatar_preview: data.avatar_url ? `${data.avatar_url.substring(0, 40)}...` : "NONE",
        });

        let tripName = "—";
        if (data.trip_id) {
          try {
            const { data: tripData, error: tripErr } = await supabase
              .from("trips")
              .select("name")
              .eq("id", data.trip_id)
              .maybeSingle();
            if (tripData?.name) tripName = tripData.name;
            if (tripErr) console.warn("⚠️ [Supabase] Trip name lookup note:", tripErr);
          } catch {
            // ignore
          }
        }

        const rawAvatar = data.avatar_url || data.avatarUrl || data.photo_url || data.image_url;
        const resolvedAvatar = normalizeAvatarUrl(rawAvatar);

        return {
          id: data.id,
          nameArabic: data.name_arabic || data.nameArabic || "معتمر",
          nameLatin: data.name_latin || data.nameLatin,
          phone: data.phone || "",
          tripId: data.trip_id || data.tripId || "",
          tripName: tripName || "—",
          uniqueCode: data.unique_code || data.uniqueCode || normCode,
          status: data.status || "مؤكد",
          passportNumber: data.passport_number || data.passportNumber,
          avatarUrl: resolvedAvatar,
          emergencyContact: data.emergency_contact || data.emergencyContact,
          gender: data.gender,
          birthDate: data.birth_date || data.birthDate,
        };
      } else {
        console.warn(`⚠️ [Supabase] No pilgrim found matching code "${normCode}". Inspecting available records...`);
        // Diagnostic probe: fetch all available records to diagnose RLS or mismatch
        try {
          const { data: sampleList, error: probeErr } = await supabase
            .from("pilgrims")
            .select("id, name_arabic, unique_code, passport_number, avatar_url")
            .limit(5);
          console.log("📋 [Supabase Diagnostic] Available pilgrims in database:", sampleList, "Probe error (if RLS blocked):", probeErr);
        } catch (probeEx) {
          console.warn("Probe exception:", probeEx);
        }
      }
    } catch (err) {
      console.error("🔴 [Supabase] Exception fetching pilgrim by unique code:", err);
    }
  } else {
    console.warn("⚠️ [Supabase] Supabase is not configured (missing URL or anon key).");
  }

  // Fallback: check localStorage for saved pilgrims or passports
  if (typeof window !== "undefined") {
    try {
      const rawPilgrims = window.localStorage.getItem("umrah_pilgrims_registry");
      if (rawPilgrims) {
        const parsed = JSON.parse(rawPilgrims);
        if (Array.isArray(parsed)) {
          const match = parsed.find(
            (p: any) =>
              (p.uniqueCode && p.uniqueCode.trim().toUpperCase() === normCode) ||
              (p.id && p.id.trim().toUpperCase() === normCode) ||
              (p.passportNumber && p.passportNumber.trim().toUpperCase() === normCode)
          );
          if (match) return match;
        }
      }

      const rawPassports = window.localStorage.getItem("umrah_passports_registry");
      if (rawPassports) {
        const parsed = JSON.parse(rawPassports);
        if (Array.isArray(parsed)) {
          const match = parsed.find(
            (p: any) =>
              (p.passportNumber && p.passportNumber.trim().toUpperCase() === normCode) ||
              (p.id && p.id.trim().toUpperCase() === normCode)
          );
          if (match) {
            return {
              id: match.id,
              nameArabic: match.fullNameArabic,
              nameLatin: match.fullNameLatin,
              phone: "—",
              tripId: "",
              tripName: "رحلة العمرة",
              uniqueCode: normCode,
              status: "مؤكد",
              passportNumber: match.passportNumber,
              avatarUrl: match.avatarUrl,
              birthDate: match.birthDate,
              gender: match.gender,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Error looking up pilgrim from localStorage:", e);
    }
  }

  return null;
};
