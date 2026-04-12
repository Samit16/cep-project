'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import styles from './ProfileUpdateModal.module.css';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { Member } from '@/types';

interface ProfileUpdateModalProps {
  member: Member;
  onClose: () => void;
}

export default function ProfileUpdateModal({ member, onClose }: ProfileUpdateModalProps) {
  const [formData, setFormData] = useState({
    occupation: member.occupation || '',
    marital_status: member.marital_status || '',
    current_place: member.current_place || '',
    kutch_town: member.kutch_town || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ApiClient.put('/members/me/update-request', formData);
      toast('Update request submitted successfully. Awaiting committee approval.', 'success');
      onClose();
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to submit update request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Request Profile Update</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.infoAlert}>
          <AlertCircle size={18} className={styles.alertIcon} />
          <p className={styles.alertText}>
            Changes will be reviewed by the Samaj Committee before appearing on your public profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Current Occupation</label>
            <input 
              type="text" 
              name="occupation"
              className={styles.input} 
              value={formData.occupation}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Marital Status</label>
            <select 
              name="marital_status"
              className={styles.select}
              value={formData.marital_status}
              onChange={handleChange}
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Current Residence (City)</label>
            <input 
              type="text" 
              name="current_place"
              className={styles.input} 
              value={formData.current_place}
              onChange={handleChange}
              placeholder="e.g. Mumbai"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kutch Origin Town</label>
            <input 
              type="text" 
              name="kutch_town"
              className={styles.input} 
              value={formData.kutch_town}
              onChange={handleChange}
              placeholder="e.g. Bhuj"
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
              {!isSubmitting && <Save size={16} style={{ marginLeft: '8px' }} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
