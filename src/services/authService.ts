import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

/**
 * Decodes standard JWT tokens (Base64 payload decoding)
 */
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

/**
 * Demo fallback profiles for offline / quick role selection
 */
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    id: 'demo-admin-id',
    email: 'admin@misktiba.tn',
    fullName: 'مدير الوكالة — misktiba',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  agent: {
    id: 'demo-agent-id',
    email: 'agent@misktiba.tn',
    fullName: 'مرافق الرحلة — Coordonnateur',
    role: 'agent',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  pilgrim: {
    id: 'demo-pilgrim-id',
    email: 'pilgrim@misktiba.tn',
    fullName: 'المعتمر — Mohamed Ali',
    role: 'pilgrim',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
};

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
      console.warn('Profile record not found, falling back to metadata:', error?.message);
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
 * Login with Supabase Auth & JWT
 */
export async function loginWithSupabase(
  email: string,
  password: string,
  selectedRole?: UserRole
): Promise<{ success: boolean; user: UserProfile | null; token: string | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Return demo login when Supabase is not configured
    const role: UserRole = selectedRole || 'admin';
    const demoUser = DEMO_PROFILES[role];
    const dummyJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ sub: demoUser.id, email: demoUser.email, role: demoUser.role, exp: Math.floor(Date.now() / 1000) + 86400 })
    )}.signature`;
    return { success: true, user: demoUser, token: dummyJwt };
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
        fullName: data.user.user_metadata?.full_name || email,
        role: selectedRole || (data.user.user_metadata?.role as UserRole) || 'agent',
      };
    }

    // Update role if explicitly selected on login
    if (selectedRole && profile.role !== selectedRole) {
      profile.role = selectedRole;
      await supabase.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        role: selectedRole,
      });
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
  fullName: string,
  role: UserRole = 'agent'
): Promise<{ success: boolean; user: UserProfile | null; token: string | null; error?: string }> {
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
