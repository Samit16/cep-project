'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import modalStyles from '../profile/ChangePasswordModal.module.css';
import { Shield, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { supabase } from '@/lib/supabase';

export default function MandatoryEmailPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Only show if the user's Supabase Auth email is still a dummy address.
  if (!mounted || !user || !user.email?.includes('@kvonagpur.com')) return null;
  if (typeof document === 'undefined') return null;

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (email.includes('@kvonagpur.com')) {
      setError('Please enter a real email address, not a system one.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First, call our server to clean up any conflicting auth entries
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not logged in. Please refresh the page.');

      const prepareRes = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, mode: 'prepare' }),
      });

      const prepareData = await prepareRes.json();

      if (!prepareRes.ok) {
        throw new Error(prepareData.error || 'Failed to prepare email change.');
      }

      // If the server said email is already set on this user, we're done!
      if (prepareData.alreadySet) {
        toast('Your email is already verified!', 'success');
        await supabase.auth.refreshSession();
        window.location.reload();
        return;
      }

      // Now use Supabase's built-in updateUser to send an OTP to the new email
      // (Supabase sends this through its configured SMTP / Resend)
      const { error: updateError } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/auth/callback` }
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      setStep('otp');
      setResendCooldown(60);
      toast('Verification code sent! Check your inbox.', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email_change',
      });

      if (verifyError) throw new Error(verifyError.message);

      // Update the members table via our API
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) {
        await fetch('/api/auth/update-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, mode: 'finalize' }),
        });
      }

      setStep('success');
      toast('Email verified and saved successfully!', 'success');
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('Code is incorrect or expired. Please request a new one.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success → refresh session and reload
  const handleDone = async () => {
    await supabase.auth.refreshSession();
    window.location.reload();
  };

  const otpComplete = otp.every(d => d !== '');
  const currentStepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  const node = (
    <div className={modalStyles.modalOverlay} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.85)' }}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>Secure Your Account</h2>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Step indicator */}
          <div className={modalStyles.stepIndicator}>
            <div className={`${modalStyles.stepDot} ${currentStepIndex >= 0 ? modalStyles.stepDotActive : ''} ${currentStepIndex > 0 ? modalStyles.stepDotCompleted : ''}`} />
            <div className={`${modalStyles.stepDot} ${currentStepIndex >= 1 ? modalStyles.stepDotActive : ''} ${currentStepIndex > 1 ? modalStyles.stepDotCompleted : ''}`} />
            <div className={`${modalStyles.stepDot} ${currentStepIndex >= 2 ? modalStyles.stepDotActive : ''}`} />
          </div>

          {error && (
            <div className={modalStyles.errorMsg}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Step: Enter Email */}
          {step === 'email' && (
            <>
              <div className={`${modalStyles.iconContainer} ${modalStyles.iconContainerPrimary}`}>
                <Shield size={28} />
              </div>
              <h3 className={modalStyles.stepTitle}>Link Your Email</h3>
              <p className={modalStyles.stepDescription}>
                Your account needs a real email address for password recovery and notifications. We&apos;ll send a verification code.
              </p>

              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Email Address</label>
                <input
                  type="email"
                  className={modalStyles.input}
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button
                className={modalStyles.primaryBtn}
                onClick={handleSendOtp}
                disabled={loading || !email}
              >
                <Send size={16} />
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </>
          )}

          {/* Step: Verify OTP */}
          {step === 'otp' && (
            <>
              <div className={`${modalStyles.iconContainer} ${modalStyles.iconContainerPrimary}`}>
                <Mail size={28} />
              </div>
              <h3 className={modalStyles.stepTitle}>Enter Verification Code</h3>
              <p className={modalStyles.stepDescription}>
                A 6-digit code was sent to <strong>{email}</strong>. Enter it below.
              </p>

              <div className={modalStyles.otpContainer} onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={modalStyles.otpInput}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                className={modalStyles.primaryBtn}
                onClick={handleVerifyOtp}
                disabled={loading || !otpComplete}
              >
                <CheckCircle2 size={16} />
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className={modalStyles.resendRow}>
                <button
                  className={modalStyles.resendBtn}
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                className={modalStyles.secondaryBtn}
                onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null); }}
              >
                ← Use a different email
              </button>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <>
              <div className={`${modalStyles.iconContainer} ${modalStyles.iconContainerSuccess}`}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={modalStyles.stepTitle}>Email Verified!</h3>
              <p className={modalStyles.stepDescription}>
                Your email has been verified and linked to your account. You&apos;re all set!
              </p>
              <button className={modalStyles.primaryBtn} onClick={handleDone}>
                Continue to App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
