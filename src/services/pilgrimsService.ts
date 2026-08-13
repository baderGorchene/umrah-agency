import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Pilgrim, Trip, DEFAULT_AVATAR_URL } from '../types';
import { initialPilgrims } from '../mockData';

export const getPilgrims = async (trips: Trip[] = []): Promise<Pilgrim[]> => {
  if (!isSupabaseConfigured()) {
    return initialPilgrims;
  }

  try {
    const { data, error } = await supabase
      .from('pilgrims')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch pilgrims from Supabase, returning mock:', error);
      return initialPilgrims;
    }

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return data.map((p) => {
      const isUnsplash = p.avatar_url && p.avatar_url.includes('unsplash.com');
      const avatarUrl = !p.avatar_url || isUnsplash ? DEFAULT_AVATAR_URL : p.avatar_url;

      return {
        id: p.id,
        nameArabic: p.name_arabic,
        nameLatin: p.name_latin,
        phone: p.phone,
        tripId: p.trip_id || '',
        tripName: p.trip_id ? tripsMap.get(p.trip_id) || '—' : '—',
        uniqueCode: p.unique_code,
        status: p.status || 'في الانتظار',
        passportNumber: p.passport_number,
        avatarUrl: avatarUrl,
        emergencyContact: p.emergency_contact,
        gender: p.gender,
        birthDate: p.birth_date,
      };
    });
  } catch (err) {
    console.error('Error fetching pilgrims from Supabase:', err);
    return initialPilgrims;
  }
};

export const createPilgrim = async (pilgrimData: Omit<Pilgrim, 'id'>, trips: Trip[] = []): Promise<Pilgrim | null> => {
  if (!isSupabaseConfigured()) {
    return { ...pilgrimData, id: `pilgrim-${Date.now()}` };
  }

  try {
    // Ensure trip_id is either a valid UUID or null to avoid DB errors when frontend provides mock IDs like 'trip-1'
    const isValidUUID = (s: any) => typeof s === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
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

    const { data, error } = await supabase.from('pilgrims').insert([payload]).select().single();
    if (error || !data) throw error;

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return {
      id: data.id,
      nameArabic: data.name_arabic,
      nameLatin: data.name_latin,
      phone: data.phone,
      tripId: data.trip_id || '',
      tripName: data.trip_id ? tripsMap.get(data.trip_id) || '—' : '—',
      uniqueCode: data.unique_code,
      status: data.status,
      passportNumber: data.passport_number,
      avatarUrl: data.avatar_url,
      emergencyContact: data.emergency_contact,
      gender: data.gender,
      birthDate: data.birth_date,
    };
  } catch (err) {
    console.error('Error creating pilgrim in Supabase:', err);
    return null;
  }
};

export const updatePilgrim = async (pilgrim: Pilgrim): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const payload = {
      trip_id: pilgrim.tripId || null,
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

    const { error } = await supabase.from('pilgrims').update(payload).eq('id', pilgrim.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating pilgrim in Supabase:', err);
    return false;
  }
};

export const deletePilgrim = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from('pilgrims').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting pilgrim from Supabase:', err);
    return false;
  }
};

export const getPilgrimByUniqueCode = async (uniqueCode: string): Promise<Pilgrim | null> => {
  const normCode = uniqueCode.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pilgrims')
        .select('*')
        .ilike('unique_code', normCode)
        .limit(1)
        .maybeSingle();

      if (data) {
        const tripName = data.trip_id
          ? (await supabase.from('trips').select('name').eq('id', data.trip_id).single()).data?.name
          : '—';

        return {
          id: data.id,
          nameArabic: data.name_arabic,
          nameLatin: data.name_latin,
          phone: data.phone,
          tripId: data.trip_id || '',
          tripName: tripName || '—',
          uniqueCode: data.unique_code,
          status: data.status || 'مؤكد',
          passportNumber: data.passport_number,
          avatarUrl: data.avatar_url,
          emergencyContact: data.emergency_contact,
          gender: data.gender,
          birthDate: data.birth_date,
        };
      }
    } catch (err) {
      console.warn('Error fetching pilgrim by unique code from Supabase:', err);
    }
  }

  // Fallback to local mock pilgrims if offline or not found in DB
  const foundLocal = initialPilgrims.find(
    (p) => p.uniqueCode.toUpperCase() === normCode || p.id === uniqueCode
  );

  if (foundLocal) {
    return foundLocal;
  }

  // General fallback for demo codes
  return initialPilgrims[0] || null;
};
