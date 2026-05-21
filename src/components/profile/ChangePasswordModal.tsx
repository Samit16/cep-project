'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import styles from './ChangePasswordModal.module.css';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();

  // Steps: 'set-password' | 'success'
  const [step, setStep] = useState<'set-password' | 'success'>('set-password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Set new password
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

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = newPassword.length >= 6 && passwordsMatch;

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
          {error && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Step: Set New Password */}
          {step === 'set-password' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <KeyRound size={28} />
              </div>
              <h3 className={styles.stepTitle}>Set New Password</h3>
              <p className={styles.stepDescription}>
                Please enter your new password below.
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
