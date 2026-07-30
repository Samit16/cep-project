import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/auth-server';

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return '***';
  const maskedName = name.length <= 2 
    ? `${name[0]}*` 
    : `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.identifier) {
      return NextResponse.json({ error: 'Username or Email is required.' }, { status: 400 });
    }

    const identifier = String(body.identifier).trim();
    if (!identifier) {
      return NextResponse.json({ error: 'Username or Email is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    let targetEmail: string | null = null;

    if (identifier.includes('@')) {
      targetEmail = identifier.toLowerCase();
    } else {
      // Look up profile by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, member_id')
        .ilike('username', identifier)
        .maybeSingle();

      if (profile) {
        // Fetch user's auth email
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
        if (userData?.user?.email) {
          targetEmail = userData.user.email;
        } else if (profile.member_id) {
          // Check members table
          const { data: member } = await supabase
            .from('members')
            .select('email')
            .eq('id', profile.member_id)
            .single();
          if (member?.email) {
            targetEmail = member.email;
          }
        }
      }
    }

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No account found with that username or email address.' },
        { status: 404 }
      );
    }

    // Check that target email is not an internal placeholder address
    if (targetEmail.endsWith('@kvonagpur.com')) {
      return NextResponse.json(
        { error: 'No verified personal email address is connected to this account. Please contact an administrator.' },
        { status: 400 }
      );
    }

    // Trigger Supabase password recovery OTP email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail);

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return NextResponse.json(
        { error: resetError.message || 'Failed to send OTP email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
      message: `OTP has been sent to ${maskEmail(targetEmail)}`,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/auth/forgot-password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
