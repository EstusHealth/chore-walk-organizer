// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vzghgjpsnzleoklcyptc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2hnanBzbnpsZW9rbGN5cHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTg5OTksImV4cCI6MjA2MDQ3NDk5OX0.AbUMq8kD2SxmOpCsU2RlhY1PESksMKBHwjyR6O_ZkV4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);