import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

/**
 * Fetch all users from public.profiles table
 */
export const getStoredLocalUsers = (): UserProfile[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("umrah_users_registry");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load local users registry:", e);
  }
  return [];
};

export const saveStoredLocalUsers = (users: UserProfile[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("umrah_users_registry", JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to save local users registry:", e);
  }
};

/**
 * Fetch all users from public.profiles table merged with local storage registry.
 * Admin account is excluded from the returned managed users list.
 */
export async function getUsers(): Promise<UserProfile[]> {
  const localUsers = getStoredLocalUsers().filter((u) => u.role !== 'admin');

  if (!isSupabaseConfigured()) {
    return localUsers;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('No profiles found in Supabase or error occurred:', error?.message);
      return localUsers;
    }

    const dbUsers: UserProfile[] = data.map((item) => ({
      id: item.id,
      email: item.email,
      fullName: item.full_name || item.email,
      role: (item.role as UserRole) || 'agent',
      phone: item.phone || '',
      avatarUrl: item.avatar_url,
      tripId: item.trip_id,
      createdAt: item.created_at,
      isConfirmed:
        item.role === 'admin'
          ? true
          : item.is_confirmed !== undefined && item.is_confirmed !== null
          ? Boolean(item.is_confirmed)
          : false,
    }));

    // Merge DB users with local users, preferring DB records by ID
    const dbIds = new Set(dbUsers.map((u) => u.id));
    const uniqueLocals = localUsers.filter((u) => !dbIds.has(u.id) && u.role !== 'admin');

    return [...dbUsers, ...uniqueLocals];
  } catch (err) {
    console.error('Failed to load users:', err);
    return localUsers;
  }
}

/**
 * Create a new user profile record
 */
const IS_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function createUser(
  newUser: Omit<UserProfile, 'id'> & { password?: string; isConfirmed?: boolean }
): Promise<UserProfile | null> {
  const normalizedEmail = newUser.email.trim().toLowerCase();
  // Admin-created users are confirmed directly by default
  const isConfirmed = newUser.isConfirmed !== undefined ? newUser.isConfirmed : true;

  // 1. Enforce that admin accounts cannot be created via the user management section
  if (newUser.role === 'admin') {
    throw new Error("La création d'un compte administrateur n'est pas autorisée ici.");
  }

  // 2. Check local duplicate
  const currentLocal = getStoredLocalUsers();
  const existsLocal = currentLocal.some(
    (u) => u.email?.trim().toLowerCase() === normalizedEmail
  );
  if (existsLocal) {
    throw new Error('Cette adresse e-mail est déjà enregistrée.');
  }

  // If Supabase is offline / not configured
  if (!isSupabaseConfigured()) {
    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    const created: UserProfile = {
      id: generatedId,
      email: normalizedEmail,
      fullName: newUser.fullName.trim(),
      role: newUser.role,
      phone: newUser.phone?.trim() || '',
      isConfirmed,
      createdAt: new Date().toISOString(),
    };

    saveStoredLocalUsers([created, ...currentLocal]);
    return created;
  }

  try {
    // 3. Check if email already exists in Supabase profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('Cette adresse e-mail est déjà enregistrée.');
    }

    let authUserId: string | null = null;

    // 4. Attempt Auth signup if password provided
    if (newUser.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName.trim(),
            role: newUser.role,
            is_confirmed: isConfirmed,
          },
        },
      });

      if (authError) {
        console.warn('Supabase auth.signUp notice:', authError.message);
        if (
          authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('user already') ||
          authError.status === 422
        ) {
          throw new Error('Cette adresse e-mail est déjà enregistrée.');
        }
        throw new Error(authError.message || 'Erreur lors de la création du compte.');
      }

      if (authData?.user) {
        authUserId = authData.user.id;
      }
    }

    const profileId = authUserId || (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0'));

    // Insert into `profiles` table
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profileId,
        email: normalizedEmail,
        full_name: newUser.fullName.trim(),
        role: newUser.role,
        phone: newUser.phone?.trim() || '',
        is_confirmed: isConfirmed,
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to create profile in Postgres:', error.message);
      if (error.message.includes('unique') || error.code === '23505') {
        throw new Error('Cette adresse e-mail est déjà enregistrée.');
      }
      throw new Error(error.message || 'Erreur lors de la sauvegarde du profil.');
    }

    const finalUser: UserProfile = {
      id: data?.id || profileId,
      email: data?.email || normalizedEmail,
      fullName: data?.full_name || newUser.fullName.trim(),
      role: (data?.role as UserRole) || newUser.role,
      phone: data?.phone || newUser.phone || '',
      isConfirmed:
        data?.is_confirmed !== undefined && data?.is_confirmed !== null
          ? Boolean(data.is_confirmed)
          : isConfirmed,
      createdAt: data?.created_at || new Date().toISOString(),
    };

    // Update local storage with final user
    saveStoredLocalUsers([finalUser, ...currentLocal]);

    return finalUser;
  } catch (err: any) {
    console.error('Error creating user profile:', err);
    throw err;
  }
}

/**
 * Update an existing user profile
 */
export async function updateUser(updated: UserProfile): Promise<boolean> {
  // Prevent altering admin accounts
  if (updated.role === 'admin') {
    console.warn('Cannot alter admin account.');
    return false;
  }

  // Always update local storage
  const currentLocal = getStoredLocalUsers();
  const targetLocal = currentLocal.find((u) => u.id === updated.id);
  if (targetLocal?.role === 'admin') {
    console.warn('Cannot alter admin account.');
    return false;
  }

  const updatedLocal = currentLocal.map((u) => (u.id === updated.id ? updated : u));
  saveStoredLocalUsers(updatedLocal);

  if (!isSupabaseConfigured() || !IS_UUID_REGEX.test(updated.id)) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updated.fullName,
        role: updated.role,
        phone: updated.phone,
        is_confirmed: updated.isConfirmed !== undefined ? Boolean(updated.isConfirmed) : false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id)
      .neq('role', 'admin');

    if (error) {
      console.error('Failed to update user profile:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating user profile:', err);
    return false;
  }
}

/**
 * Update a user's confirmation status
 */
export async function setUserConfirmationStatus(id: string, isConfirmed: boolean): Promise<boolean> {
  const currentLocal = getStoredLocalUsers();
  const target = currentLocal.find((u) => u.id === id);
  if (target?.role === 'admin') {
    console.warn('Cannot alter confirmation for admin account.');
    return false;
  }

  const updatedLocal = currentLocal.map((u) => (u.id === id ? { ...u, isConfirmed } : u));
  saveStoredLocalUsers(updatedLocal);

  if (!isSupabaseConfigured() || !IS_UUID_REGEX.test(id)) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_confirmed: isConfirmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .neq('role', 'admin');

    if (error) {
      console.error('Failed to update user confirmation status in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating confirmation status:', err);
    return false;
  }
}

/**
 * Delete a user profile
 */
export async function deleteUser(id: string): Promise<boolean> {
  const currentLocal = getStoredLocalUsers();
  const target = currentLocal.find((u) => u.id === id);
  if (target?.role === 'admin') {
    console.warn('Cannot delete admin account.');
    return false;
  }

  if (!isSupabaseConfigured()) {
    const filteredLocal = currentLocal.filter((u) => u.id !== id);
    saveStoredLocalUsers(filteredLocal);
    return true;
  }

  try {
    // 1. Attempt to delete via RPC delete_user_by_admin (removes from auth.users and public.profiles)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'delete_user_by_admin',
      { target_user_id: id }
    );

    if (!rpcError && rpcResult === true) {
      const filteredLocal = currentLocal.filter((u) => u.id !== id);
      saveStoredLocalUsers(filteredLocal);
      return true;
    }

    // 2. Fallback: Direct table delete on `public.profiles` with `.select()` to verify
    const { data: deletedRows, error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .neq('role', 'admin')
      .select();

    if (deleteError) {
      console.error('Failed to delete user profile from Supabase:', deleteError.message);
      return false;
    }

    // If RLS blocked the deletion (0 rows deleted despite matching ID)
    if (!deletedRows || deletedRows.length === 0) {
      const { data: stillExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (stillExists) {
        console.error(
          'Supabase RLS prevented deletion of profile. Please add a DELETE policy for public.profiles or execute the delete_user_by_admin RPC script.'
        );
        return false;
      }
    }

    const filteredLocal = currentLocal.filter((u) => u.id !== id);
    saveStoredLocalUsers(filteredLocal);
    return true;
  } catch (err) {
    console.error('Error deleting user profile:', err);
    return false;
  }
}
