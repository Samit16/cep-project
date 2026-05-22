'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import styles from './ProfileUpdateModal.module.css';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { Member } from '@/types';

interface FamilyMemberModalProps {
  member?: Member | null; // null = adding new, otherwise editing
  isPrimary?: boolean;
  onClose: () => void;
  onSaved: (savedMember: Member) => void;
}

export default function FamilyMemberModal({ member, isPrimary = false, onClose, onSaved }: FamilyMemberModalProps) {
  const isEditing = !!member;
  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    middle_name: member?.middle_name || '',
    last_name: member?.last_name || '',
    occupation: member?.occupation || '',
    marital_status: member?.marital_status || '',
    current_place: member?.current_place || '',
    kutch_town: member?.kutch_town || '',
    nukh: member?.nukh || '',
    birthplace: member?.birthplace || '',
    email: member?.email || '',
    contact_no: member?.contact_no || (member?.contact_numbers?.length ? member.contact_numbers[0] : ''),
    whatsapp: member?.whatsapp || '',
    relation: member?.relation || '',
    gender: member?.gender || '',
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
      let savedMember: Member;
      if (isEditing) {
        // Update existing family member
        savedMember = await ApiClient.put<Member>(`/members/family/${member!.id}`, formData);
        toast('Family member updated successfully!', 'success');
      } else {
        // Add new family member
        savedMember = await ApiClient.post<Member>('/members/family', formData);
        if (savedMember._merged) {
          toast('Matching member found! Both families have been merged successfully.', 'success');
        } else {
          toast('Family member added successfully!', 'success');
        }
      }
      onSaved(savedMember);
      onClose();
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Failed to save family member';
      toast(errorMessage, 'error');
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
          <h2 className={styles.modalTitle}>
            <UserPlus size={20} style={{ marginRight: '8px' }} />
            {isEditing ? 'Edit Family Member' : 'Add Family Member'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.infoAlert} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <UserPlus size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
          <p className={styles.alertText} style={{ color: '#1e40af' }}>
            {isEditing
              ? 'Update the details for this family member. Changes are saved directly.'
              : 'Add a new member to your family. They will appear in your Family Dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>First Name *</label>
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
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Occupation</label>
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

          {!isPrimary && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Relation to Primary Account *</label>
              <select
                name="relation"
                className={styles.select}
                value={formData.relation}
                onChange={handleChange}
                required
              >
                <option value="">Select Relation</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Father-in-law">Father-in-law</option>
                <option value="Mother-in-law">Mother-in-law</option>
                <option value="Brother-in-law">Brother-in-law</option>
                <option value="Sister-in-law">Sister-in-law</option>
                <option value="Daughter-in-law">Daughter-in-law</option>
                <option value="Son-in-law">Son-in-law</option>
                <option value="Grandson">Grandson</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Member'}
              {!isSubmitting && <Save size={16} style={{ marginLeft: '8px' }} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
