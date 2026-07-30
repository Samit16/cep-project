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

    // If username is not an email, resolve it via profiles or members table
    if (!username.includes('@')) {
      const cleanInput = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

      // 1. Look up the member by username in the profiles table (case-insensitive)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', cleanInput)
        .maybeSingle();

      if (profile) {
        // If we found the profile by username, get their actual auth email via admin API
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);

        if (userData?.user?.email && !userError) {
          loginEmail = userData.user.email;
        } else {
          loginEmail = `${cleanInput}@kvonagpur.com`;
        }
      } else {
        // 2. Profile not found yet — check if this member exists in the `members` database table!
        const parts = cleanInput.split('_');
        const lastPart = parts.length > 1 ? parts[parts.length - 1] : cleanInput;
        const firstPart = parts[0] || cleanInput;

        // Search members table by last_name or first_name
        const { data: candidateMembers } = await supabase
          .from('members')
          .select('id, first_name, middle_name, last_name, email')
          .or(`last_name.ilike.%${lastPart}%,first_name.ilike.%${firstPart}%`)
          .limit(20);

        let matchedMember: { id: string; first_name: string; middle_name?: string; last_name: string; email?: string } | null = null;
        let matchedUsername = cleanInput;

        if (candidateMembers && candidateMembers.length > 0) {
          for (const m of candidateMembers) {
            const fn = (m.first_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const mn = (m.middle_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const ln = (m.last_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            const u1 = `${fn}${mn}_${ln}`;
            const u2 = `${fn}_${ln}`;
            const u3 = `${fn}${mn}${ln}`;

            if (cleanInput === u1 || cleanInput === u2 || cleanInput === u3) {
              matchedMember = m;
              matchedUsername = u1;
              break;
            }
          }
        }

        if (matchedMember) {
          // Verify password matches expected default credentials format
          const cleanPassword = password.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
          const fn = (matchedMember.first_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const mn = (matchedMember.middle_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const ln = (matchedMember.last_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          const u1 = `${fn}${mn}_${ln}`;
          const u2 = `${fn}_${ln}`;

          if (cleanPassword === u1 || cleanPassword === u2 || cleanPassword === cleanInput) {
            // Auto-provision Auth Account & Profile for this existing database member!
            const internalAuthEmail = matchedMember.email && !matchedMember.email.includes('@kvonagpur.com')
              ? matchedMember.email
              : `${matchedUsername}@kvonagpur.com`;

            let authUserId: string | null = null;

            // Attempt to create auth user
            const { data: newAuthData, error: createErr } = await supabase.auth.admin.createUser({
              email: internalAuthEmail,
              password,
              email_confirm: true,
              user_metadata: {
                username: matchedUsername,
                first_name: matchedMember.first_name,
                last_name: matchedMember.last_name,
              },
            });

            if (newAuthData?.user) {
              authUserId = newAuthData.user.id;
            } else if (createErr?.message?.toLowerCase().includes('already exists')) {
              // User already exists in auth, find their ID
              const { data: usersList } = await supabase.auth.admin.listUsers();
              const existingUser = usersList?.users?.find(
                (u) => u.email?.toLowerCase() === internalAuthEmail.toLowerCase()
              );
              if (existingUser) authUserId = existingUser.id;
            }

            if (authUserId) {
              // Link profile to member
              await supabase.from('profiles').upsert(
                {
                  id: authUserId,
                  member_id: matchedMember.id,
                  username: matchedUsername,
                  role: 'member',
                  is_first_login: true,
                  is_active: true,
                },
                { onConflict: 'id' }
              );

              loginEmail = internalAuthEmail;
            } else {
              loginEmail = `${cleanInput}@kvonagpur.com`;
            }
          } else {
            loginEmail = `${cleanInput}@kvonagpur.com`;
          }
        } else {
          loginEmail = `${cleanInput}@kvonagpur.com`;
        }
      }
    }

    // Now attempt to sign in with the resolved email
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

    // Return the session on successful authentication
    return NextResponse.json({ session: authData.session }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

