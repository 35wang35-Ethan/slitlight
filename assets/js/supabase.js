const SUPABASE_URL = 'https://ptruiafyvqhyeodvkiub.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnVpYWZ5dnFoeWVvZHZraXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTAzMjYsImV4cCI6MjEwMjE4NjMyNn0.UYuhfgpVX471np9zdl4Zg5mUX0d406RK8_bYKwN4eIY';

const slitSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
