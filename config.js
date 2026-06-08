const SUPABASE_URL = "https://frwhvwkjtysmuvekfsal.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nR2N6qrRv-HY93tRYC0D7A_swgNNY1z";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);