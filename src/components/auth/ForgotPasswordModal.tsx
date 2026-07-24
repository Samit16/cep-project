'use client';

import React, { useState } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Step 1: Request OTP email for identifier
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your username or email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset OTP.');
      }

      setTargetEmail(data.email);
      setMaskedEmail(data.maskedEmail);
      setStep('verify');
      toast(`OTP sent to ${data.maskedEmail}`, 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and update password
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit OTP code sent to your email.');
      return;
    }
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
      // 1. Verify OTP with Supabase Recovery type
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: otpCode.trim(),
        type: 'recovery',
      });

      if (verifyError || !verifyData.session) {
        throw new Error(verifyError?.message || 'Invalid or expired OTP code.');
      }

      // 2. Update password for authenticated recovery session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update password.');
      }

      // 3. Sign out of recovery session so user logs in cleanly with new password
      await supabase.auth.signOut();

      setStep('success');
      toast('Password reset successfully! Please log in with your new password.', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Forgot Password</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* STEP 1: REQUEST OTP */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp}>
              <h3 className={styles.stepTitle}>Reset your password</h3>
              <p className={styles.stepDesc}>
                Enter your Member Username or registered Email address. We will send a 6-digit OTP code to your connected email.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Username or Email</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. mayurhemchand_savla or name@gmail.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading || !identifier.trim()}>
                {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & SET NEW PASSWORD */}
          {step === 'verify' && (
            <form onSubmit={handleResetPassword}>
              <h3 className={styles.stepTitle}>Enter OTP & New Password</h3>
              <p className={styles.stepDesc}>
                We sent a 6-digit verification code to <strong>{maskedEmail}</strong>. Please enter the code and your new password below.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>6-Digit OTP Code</label>
                <div className={styles.inputWrapper}>
                  <KeyRound size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    maxLength={6}
                    className={`${styles.inputField} ${styles.otpInput}`}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <span className={`${styles.passwordHint} ${styles.passwordMismatch}`}>
                    Password must be at least 6 characters
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {confirmPassword.length > 0 && (
                  <span className={`${styles.passwordHint} ${passwordsMatch ? styles.passwordMatch : styles.passwordMismatch}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || !otpCode || newPassword.length < 6 || !passwordsMatch}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleRequestOtp}
                disabled={isLoading}
              >
                Didn't receive code? Resend OTP
              </button>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.stepTitle}>Password Reset Complete!</h3>
              <p className={styles.stepDesc}>
                Your password has been successfully updated. Your old password has been erased and only your new password will work now.
              </p>
              <button type="button" className={styles.submitBtn} onClick={onClose}>
                Return to Sign In <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
