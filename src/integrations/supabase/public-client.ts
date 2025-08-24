// Public Supabase client for anonymous operations (signup forms, etc.)
// This client doesn't attach session headers, avoiding 401 errors for public endpoints
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qaqmlmshpifwdnrvfkao.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcW1sbXNocGlmd2RucnZma2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzcwNzMsImV4cCI6MjA3MDkxMzA3M30.xXwG-vNJ_XMMv8kgfMx5rrZiG-9zX4H7rRNogjD-ugI";

// Public client specifically for anonymous operations
// No auth storage or session persistence - prevents session headers from being sent
export const publicSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: undefined,
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      // Explicitly avoid any auth headers
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    }
  }
});