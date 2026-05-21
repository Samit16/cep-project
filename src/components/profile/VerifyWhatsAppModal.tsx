'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageSquare, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import styles from './ChangePasswordModal.module.css'; // Reusing styles from ChangePasswordModal
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast/ToastProvider';

interface VerifyWhatsAppModalProps {
  memberId: string;
  initialWhatsApp?: string;
  onClose: () => void;
  onSuccess: (newWhatsApp: string) => void;
}

export default function VerifyWhatsAppModal({ memberId, initialWhatsApp, onClose, onSuccess }: VerifyWhatsAppModalProps) {
  const { toast } = useToast();

  // Steps: 'enter-number' | 'verify-otp' | 'success'
  const [step, setStep] = useState<'enter-number' | 'verify-otp' | 'success'>('enter-number');
  const [whatsapp, setWhatsApp] = useState(initialWhatsApp || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [testModeOtp, setTestModeOtp] = useState<string | null>(null);

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
    if (!whatsapp || whatsapp.length < 8) {
      setError('Please enter a valid WhatsApp number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTestModeOtp(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not logged in. Please refresh.');

      const res = await fetch('/api/members/verify-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId, whatsapp, mode: 'send' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      if (data.otp) {
        setTestModeOtp(data.otp);
      }

      setStep('verify-otp');
      setResendCooldown(60);
      toast('Verification code sent to WhatsApp: ' + whatsapp, 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  }, [whatsapp, memberId, toast]);

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

  const handleVerifyOtp = async () => {
    setError(null);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not logged in. Please refresh.');

      const res = await fetch('/api/members/verify-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId, whatsapp, otpCode, mode: 'verify' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify WhatsApp.');
      }

      setStep('success');
      toast('WhatsApp verified successfully!', 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to verify WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');
  const currentStepIndex = step === 'enter-number' ? 0 : step === 'verify-otp' ? 1 : 2;

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Verify WhatsApp</h2>
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

          {/* Step: Enter Number */}
          {step === 'enter-number' && (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerPrimary}`}>
                <MessageSquare size={28} />
              </div>
              <h3 className={styles.stepTitle}>
                Verify WhatsApp Number
              </h3>
              <p className={styles.stepDescription}>
                Please enter the WhatsApp number you want to link. We will send a 6-digit OTP code to verify it.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>WhatsApp Number</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. +91 9876543210"
                  value={whatsapp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleSendOtp}
                disabled={isLoading || !whatsapp}
              >
                <Send size={16} />
                {isLoading ? 'Sending...' : 'Send OTP via WhatsApp'}
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
                <MessageSquare size={28} style={{ color: '#25D366' }} />
              </div>
              <h3 className={styles.stepTitle}>Enter Code</h3>
              <p className={styles.stepDescription}>
                Enter the 6-digit code sent to WhatsApp: <strong>{whatsapp}</strong>
              </p>

              {testModeOtp && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '16px',
                  fontSize: '0.8125rem',
                  color: '#3b82f6',
                  textAlign: 'center'
                }}>
                  Test Mode: Enter verification code <strong>{testModeOtp}</strong>
                </div>
              )}

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
                onClick={handleVerifyOtp}
                disabled={isLoading || !otpComplete}
              >
                <CheckCircle2 size={16} />
                {isLoading ? 'Verifying...' : 'Verify WhatsApp'}
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
              <h3 className={styles.stepTitle}>WhatsApp Verified!</h3>
              <p className={styles.stepDescription}>
                The WhatsApp number has been successfully verified and added to the member's profile.
              </p>
              <button className={styles.primaryBtn} onClick={() => onSuccess(whatsapp)}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
