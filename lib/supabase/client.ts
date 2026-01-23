'use client';
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Preferred: call supaClient() inside client components
export const supaClient = () => createBrowserClient(url, anon);

// For places that do: `import supabase from '@/lib/supabase/client'`
const supabase = supaClient();
export default supabase;
