import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Trip } from "../types";

export const getTrips = async (): Promise<Trip[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: tripsData, error } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !tripsData) {
      console.warn("Could not fetch trips from Supabase:", error);
      return []; // 👈 Do NOT return initialTrips here! Return empty array instead.
    }

    // Fetch counts for pilgrims and guides per trip dynamically
    const { data: pilgrimsData } = await supabase
      .from("pilgrims")
      .select("trip_id");
    const { data: staffData } = await supabase.from("staff").select("trip_id");

    const pilgrimCounts: Record<string, number> = {};
    const guideCounts: Record<string, number> = {};

    pilgrimsData?.forEach((p) => {
      if (p.trip_id)
        pilgrimCounts[p.trip_id] = (pilgrimCounts[p.trip_id] || 0) + 1;
    });

    staffData?.forEach((s) => {
      if (s.trip_id) guideCounts[s.trip_id] = (guideCounts[s.trip_id] || 0) + 1;
    });

    return tripsData.map((t) => ({
      id: t.id, // 👈 Real UUID from Supabase (e.g. "a1b2c3d4-...")
      name: t.name,
      startDate: t.start_date,
      endDate: t.end_date,
      makkahHotel: t.makkah_hotel || "—",
      madinahHotel: t.madinah_hotel || "—",
      pilgrimCount: pilgrimCounts[t.id] || 0,
      guideCount: guideCounts[t.id] || 0,
      active: t.active,
      busCount: t.bus_count || 1,
      flightDetails: t.flight_details || "",
    }));
  } catch (err) {
    console.error("Error fetching trips from Supabase:", err);
    return []; // 👈 Return empty array instead of mock data
  }
};

export const createTrip = async (
  tripData: Omit<Trip, "id">,
): Promise<Trip | null> => {
  if (!isSupabaseConfigured()) {
    return { ...tripData, id: `trip-${Date.now()}` };
  }

  try {
    const payload = {
      name: tripData.name,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      makkah_hotel: tripData.makkahHotel,
      madinah_hotel: tripData.madinahHotel,
      bus_count: tripData.busCount || 1,
      flight_details: tripData.flightDetails || "",
      active: tripData.active,
    };

    const { data, error } = await supabase
      .from("trips")
      .insert([payload])
      .select()
      .single();
    if (error || !data) throw error;

    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      makkahHotel: data.makkah_hotel,
      madinahHotel: data.madinah_hotel,
      pilgrimCount: 0,
      guideCount: 0,
      active: data.active,
      busCount: data.bus_count,
      flightDetails: data.flight_details,
    };
  } catch (err) {
    console.error("Error creating trip in Supabase:", err);
    return null;
  }
};

export const updateTrip = async (trip: Trip): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      name: trip.name,
      start_date: trip.startDate,
      end_date: trip.endDate,
      makkah_hotel: trip.makkahHotel,
      madinah_hotel: trip.madinahHotel,
      bus_count: trip.busCount,
      flight_details: trip.flightDetails,
      active: trip.active,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("trips")
      .update(payload)
      .eq("id", trip.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating trip in Supabase:", err);
    return false;
  }
};

export const deleteTrip = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from("trips").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting trip from Supabase:", err);
    return false;
  }
};
