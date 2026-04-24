// supabase.js

// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
const SUPABASE_URL = 'https://imuonxpbhvccclqdqvzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW9ueHBiaHZjY2xxZHFvdnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzk4NDQsImV4cCI6MjA5MjYxNTg0NH0.SxOMIVAtsspIHWZ4YhPviuPKLUdHFGtHibmL43cs-_U';

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
