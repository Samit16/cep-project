'use client';

import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle2, AlertTriangle, AtSign } from 'lucide-react';
import styles from './ChangePasswordModal.module.css';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';

interface ChangeUsernameModalProps {
  currentUsername?: string;
  onClose: () => void;
  onSuccess: (newUsername: string) => void;
}

export default function ChangeUsernameModal({ currentUsername, onClose, onSuccess }: ChangeUsernameModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'edit' | 'success'>('edit');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUsername, setSavedUsername] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validate = (val: string): string | null => {
    if (!val) return 'Username is required.';
    if (val.length < 3) return 'Username must be at least 3 characters.';
    if (val.length > 50) return 'Username must be no more than 50 characters.';
    if (!/^[a-z0-9._-]+$/.test(val)) return 'Only lowercase letters, numbers, dots, underscores, or hyphens allowed.';
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmed = newUsername.trim().toLowerCase();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (trimmed === currentUsername?.toLowerCase()) {
      setError('New username must be different from your current username.');
      return;
    }

    setIsLoading(true);
    try {
      await ApiClient.patch('/members/me', { new_username: trimmed });
      setSavedUsername(trimmed);
      setStep('success');
      toast('Username changed successfully!', 'success');
      onSuccess(trimmed);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to change username.');
    } finally {
      setIsLoading(false);
    }
  };

  const usernamePattern = /^[a-z0-9._-]*$/;
  const handleUsernameChange = (val: string) => {
    const lower = val.toLowerCase();
    if (usernamePattern.test(lower) || lower === '') {
      setNewUsername(lower);
    }
  };

  const isValid = newUsername.trim().length >= 3 && validate(newUsername.trim().toLowerCase()) === null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Change Username</h2>
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

          {step === 'edit' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <AtSign size={28} />
              </div>
              <h3 className={styles.stepTitle}>Choose a New Username</h3>
              <p className={styles.stepDescription}>
                Your username is how you sign in. After changing it, use the new username on your next login — the old one will no longer work.
              </p>

              {currentUsername && (
                <div className={styles.emailDisplay} style={{ marginBottom: '1.25rem' }}>
                  <User size={16} className={styles.emailIcon} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Current Username</div>
                    <div className={styles.emailText}>{currentUsername}</div>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>New Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontSize: '0.95rem', pointerEvents: 'none',
                  }}>@</span>
                  <input
                    type="text"
                    className={styles.input}
                    style={{ paddingLeft: '28px' }}
                    placeholder="e.g. john.doe or M-001"
                    value={newUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    autoFocus
                    maxLength={50}
                    onKeyDown={(e) => { if (e.key === 'Enter' && isValid && !isLoading) handleSubmit(); }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  3–50 characters. Letters, numbers, dots (.), underscores (_), or hyphens (-) only.
                </div>
                {newUsername.length > 0 && (
                  <span className={`${styles.passwordHint} ${isValid ? styles.passwordMatch : styles.passwordMismatch}`}>
                    {isValid ? '✓ Username looks good' : (validate(newUsername.toLowerCase()) || '')}
                  </span>
                )}
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleSubmit}
                disabled={isLoading || !isValid}
              >
                <AtSign size={16} />
                {isLoading ? 'Updating...' : 'Update Username'}
              </button>
            </>
          )}

          {step === 'success' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerSuccess}`}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={styles.stepTitle}>Username Changed!</h3>
              <p className={styles.stepDescription}>
                Your username has been updated to <strong>@{savedUsername}</strong>. Use this new username to sign in from now on.
              </p>
              <div className={styles.emailDisplay}>
                <AtSign size={16} className={styles.emailIcon} />
                <div className={styles.emailText}>{savedUsername}</div>
              </div>
              <button className={styles.primaryBtn} onClick={onClose} style={{ marginTop: '1.5rem' }}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
