import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => null);
    if (!data || !data.username || !data.password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const { username, password } = data;
    const supabase = createServerSupabase();

    let loginEmail = username;

    // If username is not an email, we need to resolve it
    if (!username.includes('@')) {
      // Look up the member by username in the profiles table (case-insensitive)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', username.trim())
        .maybeSingle();

      if (profile) {
        // If we found the profile by username, we can get their actual auth email
        // We use the admin API to get the user's email securely without exposing it to the client
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (userData?.user?.email && !userError) {
          loginEmail = userData.user.email;
        } else {
          // Fallback if somehow there's an error getting the user
          loginEmail = `${username}@kvonagpur.com`;
        }
      } else {
        // Legacy fallback: if they haven't run the migration yet, the profile won't have a username
        // So we just assume it's the old dummy email format
        loginEmail = `${username}@kvonagpur.com`;
      }
    }

    // Now attempt to sign in with the resolved email
    // Note: We use the regular auth method, not admin, to ensure proper credential validation
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // We successfully authenticated.
    // Return the session so the client can hydrate their local state.
    // IMPORTANT: We do NOT return the user's real email if they logged in with a username,
    // to prevent email enumeration/privacy leaks.
    return NextResponse.json({ session: authData.session }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
