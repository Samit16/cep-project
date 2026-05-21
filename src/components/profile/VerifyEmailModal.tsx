'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Mail, CheckCircle2, AlertTriangle, Send, LinkIcon } from 'lucide-react';
import styles from './ChangePasswordModal.module.css'; // Reusing styles from ChangePasswordModal
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth-context';

interface VerifyEmailModalProps {
  mode: 'verify' | 'change';
  initialEmail?: string;
  familyMemberId?: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

export default function VerifyEmailModal({ mode, initialEmail, familyMemberId, onClose, onSuccess }: VerifyEmailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Steps: 'enter-email' | 'verify-otp' | 'success'
  const [step, setStep] = useState<'enter-email' | 'verify-otp' | 'success'>('enter-email');
  const [email, setEmail] = useState(initialEmail || user?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If verifying a family member, initialize a temporary client that doesn't persist the session.
  // Otherwise, use the standard shared supabase client.
  const supabaseClient = useMemo(() => {
    if (familyMemberId) {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );
    }
    return supabase;
  }, [familyMemberId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    // If verifying a family member, use custom prepare step and temp client signup
    if (familyMemberId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Not logged in. Please refresh.');

        // Step 1: Hit prepare mode on backend
        const prepareRes = await fetch(`/api/members/family/${familyMemberId}/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, mode: 'prepare' }),
        });

        const prepareData = await prepareRes.json();
        if (!prepareRes.ok) {
          throw new Error(prepareData.error || 'Failed to prepare verification.');
        }

        // Step 2: Trigger OTP via signUp or resend on tempClient
        // Since we don't know if they already have an auth.users record,
        // we try signUp first. If it fails with already registered, we call resend.
        const signUpRes = await supabaseClient.auth.signUp({
          email,
          password: 'TempPassword!' + Math.random().toString(36).slice(-8),
        });

        if (signUpRes.error) {
          if (
            signUpRes.error.message.includes('already registered') || 
            signUpRes.error.message.includes('already exists')
          ) {
            const resendRes = await supabaseClient.auth.resend({
              type: 'signup',
              email,
            });
            if (resendRes.error) {
              throw new Error(resendRes.error.message);
            }
          } else {
            throw new Error(signUpRes.error.message);
          }
        }

        setStep('verify-otp');
        setResendCooldown(60);
        toast('Verification code sent to ' + email, 'success');
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to send verification code');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const isActuallyChanging = mode === 'change' || email !== user?.email;
    if (isActuallyChanging && email === user?.email) {
      setError('This is already your current email address.');
      setIsLoading(false);
      return;
    }

    if (!isActuallyChanging && user?.email_confirmed_at) {
      toast('Your email is already verified!', 'success');
      onSuccess(email);
      setIsLoading(false);
      return;
    }

    try {
      // If changing email, first clean up any conflicts via our server API
      if (isActuallyChanging) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
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

          // If email is already set, we're done
          if (prepareData.alreadySet) {
            toast('Your email is already verified!', 'success');
            onSuccess(email);
            return;
          }
        }
      }

      // Now use Supabase's built-in updateUser or resend
      const apiCall = isActuallyChanging
        ? supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/callback` })
        : supabase.auth.resend({ type: 'signup', email });

      const response = await apiCall as { error: { message: string } | null };

      const { error: updateError } = response;

      if (updateError) {
        if (updateError.message.includes('already confirmed')) {
          toast('Your email is already verified!', 'success');
          onSuccess(email);
          return;
        }
        throw new Error(updateError.message);
      }

      setStep('verify-otp');
      setResendCooldown(60);
      toast('Verification code sent to ' + email, 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  }, [email, toast, mode, onSuccess, user, familyMemberId, supabaseClient]);

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

  const handleVerifyEmail = async () => {
    setError(null);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      if (familyMemberId) {
        // Step 1: Verify OTP on the tempClient
        const response = await supabaseClient.auth.verifyOtp({
          email,
          token: otpCode,
          type: 'signup',
        });

        if (response?.error) {
          throw new Error(response.error.message || 'Invalid or expired code');
        }

        // Step 2: Update database via custom verify-email endpoint
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const res = await fetch(`/api/members/family/${familyMemberId}/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email, mode: 'finalize' }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to update family member email.');
          }
        }

        setStep('success');
        toast('Family member email verified successfully!', 'success');
        setIsLoading(false);
        return;
      }

      const isActuallyChanging = mode === 'change' || email !== user?.email;
      const response = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: isActuallyChanging ? 'email_change' : 'signup',
      });

      if (response?.error) {
        throw new Error(response.error.message || 'Invalid or expired code');
      }

      // Update the members table via our server API
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

      // Refresh the session to get updated JWT with new email
      await supabase.auth.refreshSession();

      setStep('success');
      toast('Email verified and updated successfully!', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');
  const currentStepIndex = step === 'enter-email' ? 0 : step === 'verify-otp' ? 1 : 2;

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Verify Email</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            <div className={`${styles.stepDot} ${currentStepIndex >= 0 ? styles.stepDotActive : ''} ${currentStepIndex > 0 ? styles.stepDotCompleted : ''}`} />
            <div className={`${styles.stepDot} ${currentStepIndex >= 1 ? styles.stepDotActive : ''} ${currentStepIndex > 1 ? styles.stepDotCompleted : ''}`} />
            <div className={`${styles.stepDot} ${currentStepIndex >= 2 ? styles.stepDotActive : ''}`} />
          </div>

          {error && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Step: Enter Email */}
          {step === 'enter-email' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <LinkIcon size={28} />
              </div>
              <h3 className={styles.stepTitle}>
                Verify Your Email
              </h3>
              <p className={styles.stepDescription}>
                Please enter the email address you want to link to your profile. We will send a 6-digit code to verify it.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleSendOtp}
                disabled={isLoading || !email}
              >
                <Send size={16} />
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
              <button className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
            </>
          )}

          {/* Step: Verify OTP */}
          {step === 'verify-otp' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <Mail size={28} />
              </div>
              <h3 className={styles.stepTitle}>Enter Code</h3>
              <p className={styles.stepDescription}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>

              {/* OTP Input */}
              <div className={styles.otpContainer} onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.otpInput}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleVerifyEmail}
                disabled={isLoading || !otpComplete}
              >
                <CheckCircle2 size={16} />
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              {/* Resend OTP */}
              <div className={styles.resendRow}>
                <button
                  className={styles.resendBtn}
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerSuccess}`}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={styles.stepTitle}>Email Verified!</h3>
              <p className={styles.stepDescription}>
                Your email address has been successfully verified and added to your profile.
              </p>
              <button className={styles.primaryBtn} onClick={() => onSuccess(email)}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
