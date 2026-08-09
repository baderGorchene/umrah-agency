import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppNotification } from '../types';
import { initialNotifications } from '../mockData';

export const getNotifications = async (): Promise<AppNotification[]> => {
  if (!isSupabaseConfigured()) {
    return initialNotifications;
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch notifications from Supabase, returning mock:', error);
      return initialNotifications;
    }

    return data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: 'الآن',
      read: n.read,
      type: n.type,
    }));
  } catch (err) {
    console.error('Error fetching notifications from Supabase:', err);
    return initialNotifications;
  }
};

export const createNotification = async (notifData: Omit<AppNotification, 'id' | 'time'>): Promise<AppNotification | null> => {
  if (!isSupabaseConfigured()) {
    return { ...notifData, id: `notif-${Date.now()}`, time: 'الآن' };
  }

  try {
    const payload = {
      title: notifData.title,
      message: notifData.message,
      type: notifData.type,
      read: notifData.read,
    };

    const { data, error } = await supabase.from('notifications').insert([payload]).select().single();
    if (error || !data) throw error;

    return {
      id: data.id,
      title: data.title,
      message: data.message,
      time: 'الآن',
      read: data.read,
      type: data.type,
    };
  } catch (err) {
    console.error('Error creating notification in Supabase:', err);
    return null;
  }
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking notifications read in Supabase:', err);
    return false;
  }
};

export const clearAllNotifications = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error clearing notifications in Supabase:', err);
    return false;
  }
};
