'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ProfileUpdateModal.module.css';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { Member } from '@/types';

interface ProfileUpdateModalProps {
  member: Member;
  onClose: () => void;
  onUpdated?: (updatedMember: Member) => void;
  mode?: 'self-update' | 'request-update';
}

export default function ProfileUpdateModal({ member, onClose, onUpdated, mode = 'self-update' }: ProfileUpdateModalProps) {
  const [formData, setFormData] = useState({
    first_name: member.first_name || '',
    middle_name: member.middle_name || '',
    last_name: member.last_name || '',
    occupation: member.occupation || '',
    marital_status: member.marital_status || '',
    current_place: member.current_place || '',
    kutch_town: member.kutch_town || '',
    nukh: member.nukh || '',
    birthplace: member.birthplace || '',
    email: member.email || '',
    contact_no: member.contact_no || (member.contact_numbers?.length ? member.contact_numbers[0] : ''),
    whatsapp: member.whatsapp || '',
    gender: member.gender || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'self-update') {
        // Direct update to the database
        const updatedMember = await ApiClient.put<Member>('/members/me', formData);
        toast('Profile updated successfully!', 'success');
        if (onUpdated) {
          onUpdated(updatedMember);
        }
      } else {
        // Old audit-log based request
        await ApiClient.put('/members/me/update-request', formData);
        toast('Update request submitted successfully. Awaiting committee approval.', 'success');
      }
      onClose();
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Failed to update profile';
      toast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const isSelfUpdate = mode === 'self-update';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isSelfUpdate ? 'Edit Your Profile' : 'Request Profile Update'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.infoAlert} style={isSelfUpdate ? { background: '#f0fdf4', borderColor: '#bbf7d0' } : undefined}>
          {isSelfUpdate ? (
            <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} className={styles.alertIcon} />
          )}
          <p className={styles.alertText} style={isSelfUpdate ? { color: '#166534' } : undefined}>
            {isSelfUpdate
              ? 'Your changes will be saved directly to your profile.'
              : 'Changes will be reviewed by the Samaj Committee before appearing on your public profile.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>First Name</label>
            <input 
              type="text" 
              name="first_name"
              className={styles.input} 
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Middle Name</label>
            <input 
              type="text" 
              name="middle_name"
              className={styles.input} 
              value={formData.middle_name}
              onChange={handleChange}
              placeholder="Middle Name (Optional)"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Last Name</label>
            <input 
              type="text" 
              name="last_name"
              className={styles.input} 
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              required
            />
          </div>

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
            <label className={styles.label}>Gender *</label>
            <select
              name="gender"
              className={styles.select}
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Nukh</label>
            <input 
              type="text" 
              name="nukh"
              className={styles.input} 
              value={formData.nukh}
              onChange={handleChange}
              placeholder="e.g. Bhimani"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Birthplace</label>
            <input 
              type="text" 
              name="birthplace"
              className={styles.input} 
              value={formData.birthplace}
              onChange={handleChange}
              placeholder="e.g. Nagpur"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              name="email"
              className={styles.input} 
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. name@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input 
              type="text" 
              name="contact_no"
              className={styles.input} 
              value={formData.contact_no}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>WhatsApp Number</label>
            <input 
              type="text" 
              name="whatsapp"
              className={styles.input} 
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
            />
          </div>



          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isSelfUpdate
                  ? 'Save Changes'
                  : 'Submit Request'}
              {!isSubmitting && <Save size={16} style={{ marginLeft: '8px' }} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
