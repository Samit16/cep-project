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
    contact_no: member.contact_no || (member.contact_numbers?.length ? member.contact_numbers[0] : ''),
    email: member.email || '',
    relations: member.relations || [],
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
      console.log('Submitting profile update:', formData);
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
      console.error('Profile update failed:', err);
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

  const handleRelationChange = (index: number, field: string, value: string) => {
    const updated = [...formData.relations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, relations: updated }));
  };

  const addRelation = () => {
    setFormData(prev => ({ ...prev, relations: [...prev.relations, { name: '', relation: '' }] }));
  };

  const removeRelation = (index: number) => {
    setFormData(prev => ({ ...prev, relations: prev.relations.filter((_, i) => i !== index) }));
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

          <div className={styles.formGroupWrapper} style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className={styles.label} style={{ margin: 0 }}>Family Members</label>
                <button type="button" onClick={addRelation} style={{ padding: '6px 12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  + Add Relation
                </button>
             </div>
             {formData.relations.length === 0 ? (
               <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No relations added.</p>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 {formData.relations.map((rel, index) => (
                   <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <input type="text" className={styles.input} placeholder="Name" value={rel.name} onChange={(e) => handleRelationChange(index, 'name', e.target.value)} style={{ flex: 2 }} />
                     <input type="text" className={styles.input} placeholder="Relation" value={rel.relation} onChange={(e) => handleRelationChange(index, 'relation', e.target.value)} style={{ flex: 1 }} />
                     <button type="button" onClick={() => removeRelation(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px' }}>
                       <X size={16} />
                     </button>
                   </div>
                 ))}
               </div>
             )}
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
