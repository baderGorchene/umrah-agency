import { createClient } from '@supabase/supabase-js';

// Read Supabase environment variables safely
const metaEnv = (import.meta as any).env || {};
const processEnv = typeof process !== 'undefined' ? process.env || {} : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || processEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || processEnv.VITE_SUPABASE_ANON_KEY || '';


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing in environment variables. Please check your .env configuration.');
}

/**
 * Singleton Supabase client for client-side operations (queries, subscriptions, storage)
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co'
  );
};
