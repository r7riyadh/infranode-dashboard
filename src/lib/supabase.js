import { createClient } from '@supabase/supabase-js';

let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean accidental prefixes if pasted in Github Secrets
if (rawUrl.includes('=')) {
  rawUrl = rawUrl.split('=').pop().trim();
}
if (rawKey.includes('=')) {
  rawKey = rawKey.split('=').pop().trim();
}

const supabaseUrl = rawUrl.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey.trim() || 'placeholder';

let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    }
  });
} catch (e) {
  console.error('Supabase initialization failed, falling back to local simulation:', e);
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: {
      persistSession: true,
    }
  });
}

export const supabase = supabaseClient;
