'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Info } from 'lucide-react';
import styles from './MemberFormModal.module.css';

interface MemberFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
}

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MemberFormData) => void;
  initialData?: Partial<MemberFormData>;
}

const defaultValues: MemberFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
};

/** Generates the username from name parts — mirrors the backend logic */
function buildUsername(first: string, middle: string, last: string): string {
  return `${first}${middle}_${last}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export default function MemberFormModal({ isOpen, onClose, onSave, initialData }: MemberFormModalProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    ...defaultValues,
    ...initialData,
  });

  // Sync state if initialData changes (e.g., switching between editing different members)
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...defaultValues,
        ...initialData,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const firstName = formData.first_name.trim();
  const middleName = formData.middle_name.trim();
  const lastName = formData.last_name.trim();
  const allFilled = firstName && middleName && lastName;
  const previewUsername = allFilled ? buildUsername(firstName, middleName, lastName) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? 'Edit Member' : 'Add New Member'}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label><User size={14} /> First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Rajesh"
              />
            </div>
            <div className={styles.formGroup}>
              <label><User size={14} /> Middle Name *</label>
              <input
                type="text"
                required
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                placeholder="e.g. Kumar"
              />
            </div>
            <div className={styles.formGroup}>
              <label><User size={14} /> Surname *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Kothari"
              />
            </div>
          </div>

          {/* Credentials preview — shown once all 3 fields are filled */}
          {allFilled && (
            <div className={styles.credentialsBox}>
              <div className={styles.credentialsIcon}><Info size={16} /></div>
              <div className={styles.credentialsContent}>
                <p className={styles.credentialsTitle}>Login Credentials (auto-generated)</p>
                <p className={styles.credentialsRow}>
                  <span className={styles.credentialsLabel}>Username:</span>
                  <code className={styles.credentialsValue}>{previewUsername}</code>
                </p>
                <p className={styles.credentialsRow}>
                  <span className={styles.credentialsLabel}>Password:</span>
                  <code className={styles.credentialsValue}>{previewUsername}</code>
                </p>
                <p className={styles.credentialsNote}>
                  The member can log in with the above credentials and update their profile.
                </p>
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              {initialData ? 'Update Member' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
