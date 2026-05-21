import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// POST /api/members/verify-whatsapp
// Mode: 'send' | 'verify'
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const body = await request.json().catch(() => null);
    
    if (!body?.memberId || !body?.whatsapp || !body?.mode) {
      return NextResponse.json({ error: 'memberId, whatsapp, and mode are required.' }, { status: 400 });
    }

    const targetMemberId = body.memberId;
    const whatsapp = String(body.whatsapp).trim();
    const mode = body.mode; // 'send' | 'verify'

    if (!whatsapp) {
      return NextResponse.json({ error: 'WhatsApp number is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify user owns or is in the same family as the target member
    let isAllowed = false;
    if (user.member_id === targetMemberId) {
      isAllowed = true;
    } else {
      // Check if target member is in user's family
      const { data: targetMember } = await supabase
        .from('members')
        .select('family_id')
        .eq('id', targetMemberId)
        .single();
      
      if (targetMember && user.family_id && targetMember.family_id === user.family_id) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json({ error: 'You do not have permission to manage this profile.' }, { status: 403 });
    }

    // ── MODE: SEND ───────────────────────────────────────────────────
    if (mode === 'send') {
      // Check if another member already has this WhatsApp number verified
      const { data: conflictMember } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('whatsapp', whatsapp)
        .eq('whatsapp_verified', true)
        .neq('id', targetMemberId)
        .maybeSingle();

      if (conflictMember) {
        const name = `${conflictMember.first_name || ''} ${conflictMember.last_name || ''}`.trim();
        return NextResponse.json(
          { error: `This WhatsApp number is already linked and verified by another member: ${name}.` },
          { status: 409 }
        );
      }

      // Generate a 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

      // Delete any existing verifications for this member
      await supabase
        .from('whatsapp_verifications')
        .delete()
        .eq('member_id', targetMemberId);

      // Insert new verification
      const { error: insertError } = await supabase
        .from('whatsapp_verifications')
        .insert({
          member_id: targetMemberId,
          whatsapp,
          otp_code: otpCode,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.error('Failed to save whatsapp verification:', insertError);
        return NextResponse.json({ error: 'Failed to generate verification code.' }, { status: 500 });
      }

      // Send OTP code
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

      if (twilioSid && twilioAuthToken && twilioFrom) {
        try {
          const formattedTo = whatsapp.startsWith('whatsapp:') ? whatsapp : `whatsapp:${whatsapp.startsWith('+') ? whatsapp : `+${whatsapp}`}`;
          const formattedFrom = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;

          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: formattedFrom,
              To: formattedTo,
              Body: `Your KVO Community verification code is ${otpCode}. It expires in 10 minutes.`,
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            console.error('Twilio API error:', errData);
            throw new Error(errData.message || 'Twilio send failed');
          }
          console.log(`WhatsApp OTP sent via Twilio to ${whatsapp}`);
        } catch (err: any) {
          console.error('Failed to send real WhatsApp OTP via Twilio:', err.message);
          return NextResponse.json({ 
            success: true, 
            message: 'Verification code generated, but Twilio service failed to send. Code (test mode fallback): ' + otpCode,
            otp: otpCode
          });
        }
      } else {
        // Mock mode
        console.log(`[MOCK WHATSAPP OTP] Member ${targetMemberId} OTP for ${whatsapp} is ${otpCode}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent.',
        ...(twilioSid ? {} : { otp: otpCode }) 
      });
    }

    // ── MODE: VERIFY ─────────────────────────────────────────────────
    if (mode === 'verify') {
      const otpCode = body.otpCode;
      if (!otpCode || typeof otpCode !== 'string') {
        return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
      }

      // Fetch verification code
      const { data: verification, error: fetchError } = await supabase
        .from('whatsapp_verifications')
        .select('*')
        .eq('member_id', targetMemberId)
        .eq('whatsapp', whatsapp)
        .single();

      if (fetchError || !verification) {
        return NextResponse.json({ error: 'No verification request found for this number.' }, { status: 400 });
      }

      // Check expiry
      if (new Date(verification.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Verification code has expired. Please send a new one.' }, { status: 400 });
      }

      // Match code
      if (verification.otp_code !== otpCode) {
        return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
      }

      // Update members table
      const { error: updateError } = await supabase
        .from('members')
        .update({
          whatsapp: whatsapp,
          whatsapp_verified: true,
        })
        .eq('id', targetMemberId);

      if (updateError) {
        console.error('Failed to update member whatsapp status:', updateError);
        return NextResponse.json({ error: 'Failed to update member database.' }, { status: 500 });
      }

      // Clear verification record
      await supabase
        .from('whatsapp_verifications')
        .delete()
        .eq('id', verification.id);

      return NextResponse.json({ success: true, whatsapp });
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/members/verify-whatsapp:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
