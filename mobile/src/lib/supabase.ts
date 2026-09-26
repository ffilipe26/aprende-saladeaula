import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iclhblylmaawpywikiym.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbGhibHlsbWFhd3B5d2lraXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTk1MTIsImV4cCI6MjA5NTQzNTUxMn0.Y-J4WIufaAYMH4BVmo2xow5pTR4Z0inV4DxPN2pld3Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
