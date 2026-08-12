import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

/**
 * Fetch profile from public.profiles table or user metadata
 */
export async function fetchUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('Profile record not found, checking metadata:', error?.message);
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData?.user?.user_metadata || {};
      return {
        id: userId,
        email: email,
        fullName: meta.full_name || email.split('@')[0],
        role: (meta.role as UserRole) || 'agent',
      };
    }

    return {
      id: data.id,
      email: data.email || email,
      fullName: data.full_name || email.split('@')[0],
      role: (data.role as UserRole) || 'agent',
      avatarUrl: data.avatar_url,
      phone: data.phone,
      tripId: data.trip_id,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Login with Supabase Auth
 * Role is automatically loaded from user credentials / profiles database table
 */
export async function loginWithSupabase(
  email: string,
  password: string
): Promise<{ success: boolean; user: UserProfile | null; token: string | null; error?: string }> {
  // Infer role based on email credentials when Supabase is not configured (offline demo mode)
  let inferredRole: UserRole = 'admin';
  if (email.toLowerCase().includes('agent')) inferredRole = 'agent';
  else if (email.toLowerCase().includes('pilgrim')) inferredRole = 'pilgrim';

  if (!isSupabaseConfigured()) {
    const fallbackUser: UserProfile = {
      id: 'demo-user-' + Date.now(),
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: inferredRole,
    };
    return { success: true, user: fallbackUser, token: 'demo-session-token' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return {
        success: false,
        user: null,
        token: null,
        error: error?.message || 'Identifiants invalides.',
      };
    }

    const token = data.session.access_token;
    let profile = await fetchUserProfile(data.user.id, data.user.email || email);

    if (!profile) {
      profile = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: data.user.user_metadata?.full_name || email.split('@')[0],
        role: (data.user.user_metadata?.role as UserRole) || 'agent',
      };
    }

    return {
      success: true,
      user: profile,
      token,
    };
  } catch (err: any) {
    console.error('Supabase login exception:', err);
    return {
      success: false,
      user: null,
      token: null,
      error: err?.message || 'Erreur lors de la connexion.',
    };
  }
}

/**
 * Register a new User in Supabase Auth & public.profiles
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; user: UserProfile | null; token: string | null; error?: string }> {
  const role: UserRole = 'agent';

  if (!isSupabaseConfigured()) {
    const user: UserProfile = {
      id: 'demo-' + Date.now(),
      email,
      fullName,
      role,
    };
    return { success: true, user, token: 'demo-token' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error || !data.user) {
      return { success: false, user: null, token: null, error: error?.message || 'Erreur lors de l inscription.' };
    }

    // Insert into profiles table
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email || email,
      full_name: fullName,
      role: role,
    });

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      fullName,
      role,
    };

    return {
      success: true,
      user: profile,
      token: data.session?.access_token || null,
    };
  } catch (err: any) {
    return { success: false, user: null, token: null, error: err?.message || 'Erreur lors de l inscription.' };
  }
}

/**
 * Logout User
 */
export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
}
