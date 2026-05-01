'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, Lock, CheckCircle2, AlertTriangle, Send, KeyRound, LinkIcon } from 'lucide-react';
import styles from './ChangePasswordModal.module.css';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  // Check if user has a linked Google identity (real email)
  const hasGoogleLinked = user?.identities?.some(i => i.provider === 'google');
  const googleIdentity = user?.identities?.find(i => i.provider === 'google');
  const linkedEmail = googleIdentity?.identity_data?.email || user?.email || '';

  // Steps: 'check-email' | 'send-otp' | 'verify-otp' | 'success'
  const [step, setStep] = useState<'check-email' | 'send-otp' | 'verify-otp' | 'success'>(
    hasGoogleLinked ? 'send-otp' : 'check-email'
  );
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setIsLoading(true);
    setError(null);
    try {
      // Use Supabase's built-in password reset which sends an OTP to the email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(linkedEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setStep('verify-otp');
      setResendCooldown(60);
      toast('Verification code sent to your email!', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  }, [linkedEmail, toast]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
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
    // Focus last filled input or the next empty one
    const nextIndex = Math.min(pastedData.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleChangePassword = async () => {
    setError(null);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP with Supabase
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: linkedEmail,
        token: otpCode,
        type: 'recovery',
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Invalid or expired code');
      }

      // OTP is verified, now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update password');
      }

      setStep('success');
      toast('Password changed successfully!', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to start Google linking', 'error');
      setIsLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = otpComplete && newPassword.length >= 6 && passwordsMatch;

  const currentStepIndex = step === 'check-email' ? 0 : step === 'send-otp' ? 0 : step === 'verify-otp' ? 1 : 2;

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Change Password</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Step indicator */}
          {step !== 'check-email' && (
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepDot} ${currentStepIndex >= 0 ? styles.stepDotActive : ''} ${currentStepIndex > 0 ? styles.stepDotCompleted : ''}`} />
              <div className={`${styles.stepDot} ${currentStepIndex >= 1 ? styles.stepDotActive : ''} ${currentStepIndex > 1 ? styles.stepDotCompleted : ''}`} />
              <div className={`${styles.stepDot} ${currentStepIndex >= 2 ? styles.stepDotActive : ''}`} />
            </div>
          )}

          {error && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Step: No email linked */}
          {step === 'check-email' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerWarning}`}>
                <LinkIcon size={28} />
              </div>
              <h3 className={styles.stepTitle}>Link Your Email First</h3>
              <p className={styles.stepDescription}>
                To change your password, you need a linked Google email where we can send a verification code.
                Please link your Google account first.
              </p>
              <button
                className={styles.primaryBtn}
                onClick={handleLinkGoogle}
                disabled={isLoading}
              >
                <Mail size={16} />
                {isLoading ? 'Redirecting...' : 'Link Google Account'}
              </button>
              <button className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
            </>
          )}

          {/* Step: Send OTP */}
          {step === 'send-otp' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <KeyRound size={28} />
              </div>
              <h3 className={styles.stepTitle}>Verify Your Identity</h3>
              <p className={styles.stepDescription}>
                We&apos;ll send a 6-digit verification code to your linked email address to confirm it&apos;s you.
              </p>

              <div className={styles.emailDisplay}>
                <Mail size={18} className={styles.emailIcon} />
                <span className={styles.emailText}>{linkedEmail}</span>
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                <Send size={16} />
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
              <button className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
            </>
          )}

          {/* Step: Verify OTP and set new password */}
          {step === 'verify-otp' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <Lock size={28} />
              </div>
              <h3 className={styles.stepTitle}>Enter Code & New Password</h3>
              <p className={styles.stepDescription}>
                Enter the 6-digit code sent to <strong>{linkedEmail}</strong>
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

              {/* New Password */}
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <span className={`${styles.passwordHint} ${styles.passwordMismatch}`}>
                    Password must be at least 6 characters
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword.length > 0 && (
                  <span className={`${styles.passwordHint} ${passwordsMatch ? styles.passwordMatch : styles.passwordMismatch}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleChangePassword}
                disabled={isLoading || !canSubmit}
              >
                <Lock size={16} />
                {isLoading ? 'Changing Password...' : 'Change Password'}
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
              <h3 className={styles.stepTitle}>Password Changed!</h3>
              <p className={styles.stepDescription}>
                Your password has been updated successfully. You can now use your new password to log in.
              </p>
              <button className={styles.primaryBtn} onClick={onClose}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
