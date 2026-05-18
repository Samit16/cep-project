'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, CheckCircle2, AlertTriangle, Send, LinkIcon } from 'lucide-react';
import styles from './ChangePasswordModal.module.css'; // Reusing styles from ChangePasswordModal
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ApiClient } from '@/lib/api';

import { useAuth } from '@/lib/auth-context';

interface VerifyEmailModalProps {
  mode: 'verify' | 'change';
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

export default function VerifyEmailModal({ mode, initialEmail, onClose, onSuccess }: VerifyEmailModalProps) {
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
  }, [email, toast, mode, onSuccess, user]);

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
