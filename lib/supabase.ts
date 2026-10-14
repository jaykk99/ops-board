import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Lazy client so `next build` works without env vars set. */
export function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_KEY || '';
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_KEY not set');
    client = createClient(url, key);
  }
  return client;
}
