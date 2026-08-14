import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post, Trip } from '../types';

export const getPosts = async (trips: Trip[] = []): Promise<Post[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch posts from Supabase:', error);
      return [];
    }

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return data.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.image_url,
      tripId: post.trip_id || '',
      tripName: post.trip_id ? tripsMap.get(post.trip_id) || '—' : '—',
      createdAt: new Date(post.created_at).toISOString().replace('T', ' ').slice(0, 16),
      notifyPush: post.notify_push,
    }));
  } catch (err) {
    console.error('Error fetching posts from Supabase:', err);
    return [];
  }
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>, trips: Trip[] = []): Promise<Post | null> => {
  if (!isSupabaseConfigured()) {
    return {
      ...postData,
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
  }

  try {
    const payload = {
      trip_id: postData.tripId || null,
      title: postData.title,
      content: postData.content,
      image_url: postData.imageUrl,
      notify_push: postData.notifyPush,
    };

    const { data, error } = await supabase.from('posts').insert([payload]).select().single();
    if (error || !data) throw error;

    const tripsMap = new Map(trips.map((t) => [t.id, t.name]));

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      imageUrl: data.image_url,
      tripId: data.trip_id || '',
      tripName: data.trip_id ? tripsMap.get(data.trip_id) || '—' : '—',
      createdAt: new Date(data.created_at).toISOString().replace('T', ' ').slice(0, 16),
      notifyPush: data.notify_push,
    };
  } catch (err) {
    console.error('Error creating post in Supabase:', err);
    return null;
  }
};

export const deletePost = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting post from Supabase:', err);
    return false;
  }
};
