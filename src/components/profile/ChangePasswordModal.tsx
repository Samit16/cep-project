'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, CheckCircle2, AlertTriangle, Send, KeyRound } from 'lucide-react';
import styles from './ChangePasswordModal.module.css';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Steps: 'send-otp' | 'verify-otp' | 'set-password' | 'success'
  const [step, setStep] = useState<'send-otp' | 'verify-otp' | 'set-password' | 'success'>('send-otp');
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

  // Step 1: Send OTP to the user's verified email
  const handleSendOtp = async () => {
    if (!user?.email) {
      setError('No email address linked to your account. Please verify your email first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (resetError) throw new Error(resetError.message);

      setStep('verify-otp');
      setResendCooldown(60);
      toast('Verification code sent to ' + user.email, 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: user?.email || '',
        token: otpCode,
        type: 'recovery',
      });

      if (verifyError) throw new Error(verifyError.message);

      setStep('set-password');
      toast('Identity verified!', 'success');
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('Code is incorrect or expired. Please request a new one.');
      } else {
        setError(msg || 'Verification failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetPassword = async () => {
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw new Error(updateError.message);

      setStep('success');
      toast('Password changed successfully!', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = newPassword.length >= 6 && passwordsMatch;

  const currentStepIndex = step === 'send-otp' ? 0 : step === 'verify-otp' ? 1 : step === 'set-password' ? 2 : 3;

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
          <div className={styles.stepIndicator}>
            <div className={`${styles.stepDot} ${currentStepIndex >= 0 ? styles.stepDotActive : ''} ${currentStepIndex > 0 ? styles.stepDotCompleted : ''}`} />
            <div className={`${styles.stepDot} ${currentStepIndex >= 1 ? styles.stepDotActive : ''} ${currentStepIndex > 1 ? styles.stepDotCompleted : ''}`} />
            <div className={`${styles.stepDot} ${currentStepIndex >= 2 ? styles.stepDotActive : ''} ${currentStepIndex > 2 ? styles.stepDotCompleted : ''}`} />
          </div>

          {error && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Step: Send OTP */}
          {step === 'send-otp' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <Mail size={28} />
              </div>
              <h3 className={styles.stepTitle}>Verify Your Identity</h3>
              <p className={styles.stepDescription}>
                For security, we&apos;ll send a verification code to your email before allowing a password change.
              </p>

              {user?.email && (
                <div className={styles.emailDisplay}>
                  <Mail size={16} className={styles.emailIcon} />
                  <span className={styles.emailText}>{user.email}</span>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                <Send size={16} />
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
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
                <Lock size={28} />
              </div>
              <h3 className={styles.stepTitle}>Enter Verification Code</h3>
              <p className={styles.stepDescription}>
                Enter the 6-digit code sent to <strong>{user?.email}</strong>
              </p>

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
                onClick={handleVerifyOtp}
                disabled={isLoading || !otpComplete}
              >
                <CheckCircle2 size={16} />
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

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

          {/* Step: Set New Password */}
          {step === 'set-password' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <KeyRound size={28} />
              </div>
              <h3 className={styles.stepTitle}>Set New Password</h3>
              <p className={styles.stepDescription}>
                Your identity has been verified. Please enter your new password below.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <span className={`${styles.passwordHint} ${styles.passwordMismatch}`}>
                    Password must be at least 6 characters
                  </span>
                )}
              </div>

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
                onClick={handleSetPassword}
                disabled={isLoading || !canSubmit}
              >
                <Lock size={16} />
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
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
