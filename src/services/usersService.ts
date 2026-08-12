import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export const INITIAL_MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    email: 'admin@misktiba.tn',
    fullName: 'محمد علي — مدير الوكالة',
    role: 'admin',
    phone: '+216 71 123 456',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    email: 'agent@misktiba.tn',
    fullName: 'ياسين الفرجاني — مرافق رحلات',
    role: 'agent',
    phone: '+216 98 765 432',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    email: 'pilgrim@misktiba.tn',
    fullName: 'فاطمة التونسي — معتمرة',
    role: 'pilgrim',
    phone: '+216 55 443 322',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Fetch all users from public.profiles table
 */
export async function getUsers(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_MOCK_USERS;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('No profiles found in Supabase or error occurred:', error?.message);
      return INITIAL_MOCK_USERS;
    }

    return data.map((item) => ({
      id: item.id,
      email: item.email,
      fullName: item.full_name || item.email,
      role: (item.role as UserRole) || 'agent',
      phone: item.phone || '',
      avatarUrl: item.avatar_url,
      tripId: item.trip_id,
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Failed to load users:', err);
    return INITIAL_MOCK_USERS;
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

    return data
      ? {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role as UserRole,
          phone: data.phone,
          createdAt: data.created_at,
        }
      : created;
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
