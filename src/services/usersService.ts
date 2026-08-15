import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

/**
 * Fetch all users from public.profiles table
 */
const getStoredLocalUsers = (): UserProfile[] => {
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

const saveStoredLocalUsers = (users: UserProfile[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("umrah_users_registry", JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to save local users registry:", e);
  }
};

/**
 * Fetch all users from public.profiles table merged with local storage registry
 */
export async function getUsers(): Promise<UserProfile[]> {
  const localUsers = getStoredLocalUsers();

  if (!isSupabaseConfigured()) {
    return localUsers;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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
    }));

    // Merge DB users with local users, preferring DB records by ID
    const dbIds = new Set(dbUsers.map((u) => u.id));
    const uniqueLocals = localUsers.filter((u) => !dbIds.has(u.id));

    return [...dbUsers, ...uniqueLocals];
  } catch (err) {
    console.error('Failed to load users:', err);
    return localUsers;
  }
}

/**
 * Create a new user profile record
 */
export async function createUser(
  newUser: Omit<UserProfile, 'id'> & { password?: string }
): Promise<UserProfile | null> {
  const generatedId = 'usr-' + Date.now();
  const created: UserProfile = {
    id: generatedId,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
    phone: newUser.phone,
    createdAt: new Date().toISOString(),
  };

  // Always persist locally
  const currentLocal = getStoredLocalUsers();
  saveStoredLocalUsers([created, ...currentLocal]);

  if (!isSupabaseConfigured()) {
    return created;
  }

  try {
    // Attempt Auth signup if password provided
    if (newUser.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName,
            role: newUser.role,
          },
        },
      });

      if (!authError && authData.user) {
        created.id = authData.user.id;
      }
    }

    // Insert or update profiles table
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: created.id,
        email: created.email,
        full_name: created.fullName,
        role: created.role,
        phone: created.phone,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create profile in Postgres:', error.message);
    }

    const finalUser = data
      ? {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role as UserRole,
          phone: data.phone,
          createdAt: data.created_at,
        }
      : created;

    // Update local storage with final ID
    const updatedLocal = getStoredLocalUsers().map((u) =>
      u.id === generatedId ? finalUser : u,
    );
    saveStoredLocalUsers(updatedLocal);

    return finalUser;
  } catch (err) {
    console.error('Error creating user profile:', err);
    return created;
  }
}

/**
 * Update an existing user profile
 */
export async function updateUser(updated: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updated.fullName,
        role: updated.role,
        phone: updated.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id);

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
 * Delete a user profile
 */
export async function deleteUser(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete user profile:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting user profile:', err);
    return false;
  }
}
