'use client';

import React, { useState } from 'react';
import { X, User, Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import styles from './MemberFormModal.module.css';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function MemberFormModal({ isOpen, onClose, onSave, initialData }: MemberFormModalProps) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    profession: '',
    city: '',
    phone: '',
    role: 'member',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
          <div className={styles.formGroup}>
            <label><User size={14} /> Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rajesh Kothari"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label><Mail size={14} /> Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rajesh@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label><Phone size={14} /> Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98XXX XXXXX"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label><Briefcase size={14} /> Profession</label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className={styles.formGroup}>
              <label><MapPin size={14} /> City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Member Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="member">Regular Member</option>
              <option value="committee">Committee Member</option>
            </select>
          </div>

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
