import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfvgjyfrjawqpdpwicev.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmdqeWZyamF3cXBkcHdpY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM5OTUsImV4cCI6MjA4MDg4OTk5NX0.ORKsqnNyfOtU9T9u6YWmo4j1pldMAC_ZakMCRMCiVmo';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
