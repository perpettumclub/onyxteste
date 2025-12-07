import { createClient } from '@supabase/supabase-js';
import { debugLog } from '../config/debug';

// NOTE: These should be in a .env file. 
// For now, we'll use placeholders or rely on the user to add them.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    debugLog('API', 'Supabase credentials not found. Backend features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

debugLog('API', 'Supabase client initialized');
