import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { getStoredLocalUsers, saveStoredLocalUsers } from './usersService';

/**
 * Fetch profile from public.profiles table or user metadata
 */
export async function fetchUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    const localUsers = getStoredLocalUsers();
    const found = localUsers.find(
      (u) => u.id === userId || u.email?.trim().toLowerCase() === normalizedEmail
    );
    if (found) return found;
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userData } = await supabase.auth.getUser();
    const meta = userData?.user?.user_metadata || {};
    const authEmail = userData?.user?.email || normalizedEmail;

    if (error || !data) {
      console.warn('Profile record not found in table, extracting from auth metadata:', error?.message);
      const role = (meta.role as UserRole) || 'agent';
      const isConfirmed =
        role === 'admin'
          ? true
          : meta.is_confirmed !== undefined
          ? Boolean(meta.is_confirmed)
          : false;

      return {
        id: userId,
        email: authEmail,
        fullName: meta.full_name || meta.name || authEmail.split('@')[0],
        role: role,
        avatarUrl: meta.avatar_url || meta.picture || undefined,
        phone: meta.phone || undefined,
        isConfirmed: isConfirmed,
      };
    }

    const role = (data.role as UserRole) || (meta.role as UserRole) || 'agent';
    const isConfirmed =
      role === 'admin'
        ? true
        : data.is_confirmed !== undefined
        ? Boolean(data.is_confirmed)
        : meta.is_confirmed !== undefined
        ? Boolean(meta.is_confirmed)
        : false;

    return {
      id: data.id,
      email: data.email || authEmail,
      fullName: data.full_name || meta.full_name || authEmail.split('@')[0],
      role: role,
      avatarUrl: data.avatar_url || meta.avatar_url || meta.picture,
      phone: data.phone || meta.phone,
      tripId: data.trip_id,
      createdAt: data.created_at,
      isConfirmed: isConfirmed,
    };
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Login with Supabase Auth
 * Only confirmed users (or admin) can access the system.
 */
export async function loginWithSupabase(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user: UserProfile | null;
  token: string | null;
  error?: string;
  isUnconfirmed?: boolean;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  // Infer role based on email credentials when Supabase is not configured (offline demo mode)
  let inferredRole: UserRole = 'agent';
  if (normalizedEmail === 'admin@demo.com' || normalizedEmail === 'admin@example.com') inferredRole = 'admin';
  else if (normalizedEmail.includes('pilgrim')) inferredRole = 'pilgrim';

  if (!isSupabaseConfigured()) {
    const localUsers = getStoredLocalUsers();
    const existing = localUsers.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );

    if (existing) {
      if (existing.role !== 'admin' && existing.isConfirmed === false) {
        return {
          success: false,
          user: null,
          token: null,
          error: 'UNCONFIRMED_USER',
          isUnconfirmed: true,
        };
      }
      return {
        success: true,
        user: { ...existing, isConfirmed: existing.isConfirmed ?? true },
        token: 'demo-session-token',
      };
    }

    if (inferredRole === 'admin') {
      const fallbackUser: UserProfile = {
        id: 'demo-admin-' + Date.now(),
        email: normalizedEmail,
        fullName: normalizedEmail.split('@')[0].toUpperCase(),
        role: 'admin',
        isConfirmed: true,
      };
      return { success: true, user: fallbackUser, token: 'demo-session-token' };
    }

    return {
      success: false,
      user: null,
      token: null,
      error: 'Identifiants invalides.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
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
    let profile = await fetchUserProfile(data.user.id, data.user.email || normalizedEmail);

    if (!profile) {
      const meta = data.user.user_metadata || {};
      const role = (meta.role as UserRole) || 'agent';
      profile = {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        fullName: meta.full_name || meta.name || normalizedEmail.split('@')[0],
        role: role,
        avatarUrl: meta.avatar_url || meta.picture,
        phone: meta.phone,
        isConfirmed:
          role === 'admin'
            ? true
            : meta.is_confirmed !== undefined
            ? Boolean(meta.is_confirmed)
            : false,
      };
    }

    // Enforce admin confirmation: only confirmed users can access the application
    if (profile.role !== 'admin' && profile.isConfirmed === false) {
      await supabase.auth.signOut();
      return {
        success: false,
        user: null,
        token: null,
        error: 'UNCONFIRMED_USER',
        isUnconfirmed: true,
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
 * Register a new User via LoginView
 * Registered users must be confirmed first by an admin before they can log in.
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  fullName: string
): Promise<{
  success: boolean;
  user: UserProfile | null;
  token: string | null;
  requiresConfirmation?: boolean;
  error?: string;
}> {
  const role: UserRole = 'agent';
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    const currentLocal = getStoredLocalUsers();
    const exists = currentLocal.some(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );
    if (exists) {
      return {
        success: false,
        user: null,
        token: null,
        error: 'Cette adresse e-mail est déjà enregistrée.',
      };
    }

    const generatedId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'demo-' + Date.now();

    const user: UserProfile = {
      id: generatedId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      role,
      isConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    saveStoredLocalUsers([user, ...currentLocal]);

    return {
      success: true,
      user,
      token: null,
      requiresConfirmation: true,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: role,
          is_confirmed: false,
        },
      },
    });

    if (error || !data.user) {
      return {
        success: false,
        user: null,
        token: null,
        error: error?.message || "Erreur lors de l'inscription.",
      };
    }

    // Insert into profiles table with is_confirmed = false
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        full_name: fullName.trim(),
        role: role,
        is_confirmed: false,
      });
    } catch (dbErr) {
      console.warn('Could not insert profile into public.profiles table:', dbErr);
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || normalizedEmail,
      fullName: fullName.trim(),
      role,
      isConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    // Update local storage registry
    const currentLocal = getStoredLocalUsers();
    const exists = currentLocal.some((u) => u.id === profile.id);
    if (!exists) {
      saveStoredLocalUsers([profile, ...currentLocal]);
    }

    // Return requiresConfirmation: true and no session token so user does not log in directly
    return {
      success: true,
      user: profile,
      token: null,
      requiresConfirmation: true,
    };
  } catch (err: any) {
    return {
      success: false,
      user: null,
      token: null,
      error: err?.message || "Erreur lors de l'inscription.",
    };
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
