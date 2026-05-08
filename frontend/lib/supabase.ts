import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// SUPABASE CONFIGURATION
//
// These values come from your Supabase project dashboard:
//   https://supabase.com/dashboard → Project Settings → API
//
// EXPO_PUBLIC_ prefix makes them accessible in client code.
// Both values are safe to expose in the frontend — Row Level
// Security (RLS) on the database is what protects your data.
// ============================================================
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist sessions in AsyncStorage so users stay logged in
    // across app restarts on native platforms
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
