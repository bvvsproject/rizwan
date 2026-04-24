// supabase.js

// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
const SUPABASE_URL = 'https://owzehxahvpfwgrvwwsir.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93emVoeGFodnBmd2dydnd3c2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDg0OTEsImV4cCI6MjA5MjYyNDQ5MX0.dUrnmBKzlwis7INz9HhDr_KP3nCTEkHU7GUaikxAXG4';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if user is logged in
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return session;
    } catch (err) {
        console.error("Supabase auth check failed:", err.message);
        return null;
    }
}
