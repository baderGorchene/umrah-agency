import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";

export const normalizeAvatarUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || rawUrl.trim() === "") return DEFAULT_AVATAR_URL;
  const trimmed = rawUrl.trim();
  if (trimmed.includes("unsplash.com")) return DEFAULT_AVATAR_URL;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (isSupabaseConfigured()) {
    try {
      const cleanPath = trimmed.startsWith("avatars/")
        ? trimmed.replace(/^avatars\//, "")
        : trimmed;
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
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("umrah_pilgrims_registry");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn("Failed to load local pilgrims registry:", e);
      }
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("pilgrims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Could not fetch pilgrims from Supabase:", error);
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("umrah_pilgrims_registry");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
          }
        } catch (e) {}
      }
      return [];
    }

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    const parsedPilgrims: Pilgrim[] = data.map((p: any) => {
      const rawAvatar =
        p.avatar_url || p.avatarUrl || p.photo_url || p.image_url;
      const avatarUrl = normalizeAvatarUrl(rawAvatar);

      return {
        id: p.id,
        nameArabic: p.name_arabic || p.nameArabic || "معتمر",
        nameLatin: p.name_latin || p.nameLatin,
        tripId: p.trip_id || p.tripId || "",
        tripName: (p.trip_id ? tripsMap.get(p.trip_id) : undefined) || "—",
        uniqueCode: p.unique_code || p.uniqueCode || "",
        status: p.status || "في الانتظار",
        passportNumber: p.passport_number || p.passportNumber,
        avatarUrl: avatarUrl,
        emergencyContact: p.emergency_contact || p.emergencyContact,
        gender: p.gender,
        birthDate: p.birth_date || p.birthDate,
        paidAmount:
          p.paid_amount != null
            ? Number(p.paid_amount)
            : p.paidAmount != null
              ? Number(p.paidAmount)
              : 0,
        unpaidAmount:
          p.unpaid_amount != null
            ? Number(p.unpaid_amount)
            : p.unpaidAmount != null
              ? Number(p.unpaidAmount)
              : 0,
      };
    });

    if (typeof window !== "undefined" && parsedPilgrims.length > 0) {
      try {
        localStorage.setItem("umrah_pilgrims_registry", JSON.stringify(parsedPilgrims));
      } catch (e) {}
    }

    return parsedPilgrims;
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
      unique_code: pilgrimData.uniqueCode
        ? pilgrimData.uniqueCode.trim().toUpperCase()
        : null,
      status: pilgrimData.status,
      passport_number: pilgrimData.passportNumber,
      avatar_url: pilgrimData.avatarUrl,
      emergency_contact: pilgrimData.emergencyContact,
      gender: pilgrimData.gender,
      birth_date: pilgrimData.birthDate,
      paid_amount: Number(pilgrimData.paidAmount) || 0,
      unpaid_amount: Number(pilgrimData.unpaidAmount) || 0,
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
      tripId: data.trip_id || "",
      tripName: data.trip_id ? tripsMap.get(data.trip_id) || "—" : "—",
      uniqueCode: data.unique_code,
      status: data.status,
      passportNumber: data.passport_number,
      avatarUrl: data.avatar_url,
      emergencyContact: data.emergency_contact,
      gender: data.gender,
      birthDate: data.birth_date,
      paidAmount: data.paid_amount != null ? Number(data.paid_amount) : 0,
      unpaidAmount: data.unpaid_amount != null ? Number(data.unpaid_amount) : 0,
    };
  } catch (err) {
    console.error("Error creating pilgrim in Supabase:", err);
    return null;
  }
};

export const updatePilgrim = async (pilgrim: Pilgrim): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const isValidUUID = (s: any) =>
      typeof s === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        s,
      );
    const tripId = isValidUUID(pilgrim.tripId) ? pilgrim.tripId : null;

    const payload = {
      trip_id: tripId,
      name_arabic: pilgrim.nameArabic,
      name_latin: pilgrim.nameLatin,
      status: pilgrim.status,
      passport_number: pilgrim.passportNumber,
      avatar_url: pilgrim.avatarUrl,
      emergency_contact: pilgrim.emergencyContact,
      gender: pilgrim.gender,
      birth_date: pilgrim.birthDate,
      paid_amount: Number(pilgrim.paidAmount) || 0,
      unpaid_amount: Number(pilgrim.unpaidAmount) || 0,
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
  uniqueCodeOrId: string,
): Promise<Pilgrim | null> => {
  const normCode = uniqueCodeOrId.trim();
  const upperCode = normCode.toUpperCase();

  // Helper to validate UUID format before passing to PostgreSQL
  const isValidUUID = (s: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      s,
    );

  console.log("🔍 [pilgrimsService] Resolving pilgrim by Code/ID:", normCode);

  if (isSupabaseConfigured()) {
    try {
      let data: any = null;

      // 1. Check direct ID match on pilgrims ONLY if normCode is a valid UUID
      if (isValidUUID(normCode)) {
        console.log(
          "📡 [Supabase] Checking direct UUID match on pilgrims table...",
        );
        const idRes = await supabase
          .from("pilgrims")
          .select("*")
          .eq("id", normCode)
          .maybeSingle();

        if (idRes.data) {
          data = idRes.data;
          console.log(
            "✅ [Supabase] Pilgrim matched directly by UUID:",
            data.id,
          );
        }
      }

      // 2. If not matched by UUID, check badge_generations table for short codes (e.g. YELC9821)
      if (!data) {
        console.log(
          "📡 [Supabase] Checking badge_generations for code:",
          upperCode,
        );
        const { data: badgeRecord, error: badgeErr } = await supabase
          .from("badge_generations")
          .select("pilgrim_id")
          .ilike("unique_code", upperCode)
          .limit(1)
          .maybeSingle();

        if (badgeErr) {
          console.warn(
            "⚠️ [Supabase] badge_generations query warning:",
            badgeErr,
          );
        }

        if (badgeRecord?.pilgrim_id) {
          console.log(
            "✅ [Supabase] Matched badge_generations! Pilgrim ID:",
            badgeRecord.pilgrim_id,
          );
          const res = await supabase
            .from("pilgrims")
            .select("*")
            .eq("id", badgeRecord.pilgrim_id)
            .maybeSingle();
          data = res.data;
        }
      }

      // 3. Fallback: Query pilgrims table directly by unique_code or passport_number
      if (!data) {
        console.log(
          "📡 [Supabase] Checking unique_code or passport_number on pilgrims table...",
        );
        const codeRes = await supabase
          .from("pilgrims")
          .select("*")
          .ilike("unique_code", upperCode)
          .limit(1)
          .maybeSingle();

        data = codeRes.data;

        if (!data) {
          const passportRes = await supabase
            .from("pilgrims")
            .select("*")
            .ilike("passport_number", upperCode)
            .limit(1)
            .maybeSingle();
          data = passportRes.data;
        }
      }

      // 4. Return formatted Pilgrim record if matched
      if (data) {
        let tripName = "—";
        if (data.trip_id) {
          try {
            const { data: tripData } = await supabase
              .from("trips")
              .select("name")
              .eq("id", data.trip_id)
              .maybeSingle();
            if (tripData?.name) tripName = tripData.name;
          } catch {
            // ignore
          }
        }

        const rawAvatar =
          data.avatar_url || data.avatarUrl || data.photo_url || data.image_url;
        return {
          id: data.id,
          nameArabic: data.name_arabic || data.nameArabic || "معتمر",
          nameLatin: data.name_latin || data.nameLatin,
          tripId: data.trip_id || data.tripId || "",
          tripName: tripName || "—",
          uniqueCode: data.unique_code || upperCode,
          status: data.status || "مؤكد",
          passportNumber: data.passport_number || data.passportNumber,
          avatarUrl: normalizeAvatarUrl(rawAvatar),
          emergencyContact: data.emergency_contact || data.emergencyContact,
          gender: data.gender,
          birthDate: data.birth_date || data.birthDate,
          paidAmount: data.paid_amount != null ? Number(data.paid_amount) : 0,
          unpaidAmount: data.unpaid_amount != null ? Number(data.unpaid_amount) : 0,
        };
      }
    } catch (err) {
      console.error("🔴 [Supabase] Exception resolving pilgrim:", err);
    }
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    try {
      const rawPilgrims = window.localStorage.getItem(
        "umrah_pilgrims_registry",
      );
      if (rawPilgrims) {
        const parsed = JSON.parse(rawPilgrims);
        if (Array.isArray(parsed)) {
          const match = parsed.find(
            (p: any) =>
              (p.id && String(p.id).trim().toUpperCase() === upperCode) ||
              (p.uniqueCode &&
                p.uniqueCode.trim().toUpperCase() === upperCode) ||
              (p.passportNumber &&
                p.passportNumber.trim().toUpperCase() === upperCode),
          );
          if (match) return match;
        }
      }
    } catch (e) {
      console.warn("Error reading localStorage:", e);
    }
  }

  return null;
};
