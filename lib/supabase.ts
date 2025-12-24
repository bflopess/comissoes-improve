import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsiwtnicqtzbwhsgdhrc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaXd0bmljcXR6Yndoc2dkaHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzEzMDEsImV4cCI6MjA4MjAwNzMwMX0.bgCy_PdWSQ19ZeKh8mpx73rnz1h21V0eltAU19Cr-Ww';

// Client-side client (for existing code compatibility)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side client helper
export async function createClientServer() {
    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

