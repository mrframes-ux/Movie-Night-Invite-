import { createClient } from '@supabase/supabase-js';

export interface Invitation {
  id?: string;
  movie_title: string;
  movie_poster: string;
  movie_backdrop: string;
  streaming_url: string;
  partner_name: string;
  sender_name: string;
  date: string;
  time: string;
  location: string;
  letter: string;
  theme: 'light' | 'luxury';
  created_at?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Real Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Abstracted DB helper functions that seamlessly fall back to localStorage
export const db = {
  getInvitation: async (id: string): Promise<{ data: Invitation | null; error: any }> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    } else {
      // Offline fallback: try to load from localStorage
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(`invite_${id}`);
        if (item) {
          try {
            const data = JSON.parse(item) as Invitation;
            return { data, error: null };
          } catch (e) {
            return { data: null, error: { message: 'Failed to parse cached invitation' } };
          }
        }
      }
      return { data: null, error: { message: 'Supabase not configured and invitation not found locally' } };
    }
  },

  createInvitation: async (invite: Invitation): Promise<{ data: Invitation | null; error: any }> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('invitations')
        .insert([invite])
        .select()
        .single();
      return { data, error };
    } else {
      // Offline fallback: generate mock ID and save to localStorage
      const mockId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newInvite: Invitation = {
        ...invite,
        id: mockId,
        created_at: new Date().toISOString()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`invite_${mockId}`, JSON.stringify(newInvite));
      }
      
      return { data: newInvite, error: null };
    }
  }
};
