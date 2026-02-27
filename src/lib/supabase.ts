import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrmqhoygbalfhvtxlmsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybXFob3lnYmFsZmh2dHhsbXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTUxNDcsImV4cCI6MjA4NzY5MTE0N30.4YB3r69G2GuOD5DvgHnZH-hEofShJe1LMbjiTpgGnek';

export const supabase = createClient(supabaseUrl, supabaseKey);
