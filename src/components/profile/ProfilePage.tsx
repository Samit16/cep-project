'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, Eye, ShieldCheck, Mail, Phone, CheckCircle2, LogOut, AlertTriangle, X, Send } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import { motion } from 'framer-motion';
import { Member } from '@/types';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ProfilePageProps {
  memberId?: string;
}

export default function ProfilePage({ memberId }: ProfilePageProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalMode, setUpdateModalMode] = useState<'self-update' | 'request-update'>('self-update');
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);

  // Notification state for pending update requests on own profile
  const [pendingNotification, setPendingNotification] = useState<any>(null);
  
  const { profile, role, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
      // Small delay to ensure cookies are fully cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 150));
      window.location.href = '/home';
    } catch {
      // Force redirect even if logout had an error
      window.location.href = '/home';
    }
  };

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = memberId ? `/members/${memberId}` : '/members/me';
      const data = await ApiClient.get<Member>(endpoint);
      setMember(data);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Check for pending update-request notifications on own profile
  const isMyProfile = !memberId || memberId === 'me' || profile?.member_id === (member?._id || member?.id);

  useEffect(() => {
    if (!isMyProfile) return;
    
    async function checkNotifications() {
      try {
        const data = await ApiClient.get<any>('/members/me/notifications');
        if (data.hasPendingRequest && data.notification) {
          setPendingNotification(data.notification);
        }
      } catch {
        // Silently fail — notifications are not critical
      }
    }
    checkNotifications();
  }, [isMyProfile]);

  const handleDismissNotification = async () => {
    if (!pendingNotification?.id) return;
    try {
      await ApiClient.put('/members/me/notifications', { notificationId: pendingNotification.id });
      setPendingNotification(null);
      toast('Notification dismissed', 'success');
    } catch {
      toast('Failed to dismiss notification', 'error');
    }
  };

  // Committee member requests another member to update profile
  const handleRequestUpdate = async () => {
    const targetId = member?._id || member?.id;
    if (!targetId) return;

    setIsRequestingUpdate(true);
    try {
      await ApiClient.post(`/members/${targetId}/request-update`, {});
      toast('Update request sent to this member successfully!', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to send update request', 'error');
    } finally {
      setIsRequestingUpdate(false);
    }
  };

  // Open edit modal for own profile
  const handleEditProfile = () => {
    setUpdateModalMode('self-update');
    setIsUpdateModalOpen(true);
  };

  // Callback after successful profile update
  const handleProfileUpdated = (updatedMember: Member) => {
    setMember(updatedMember);
    // Also dismiss any pending notification since they've updated
    if (pendingNotification) {
      handleDismissNotification();
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!member) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Profile unavailable.</div>;
  }

  const nameParts = (member.name || '').split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  const initials = (member.name || '?').split(' ').map(n => n?.[0]).join('');

  const canEdit = isMyProfile;
  const isCommitteeViewingOther = !isMyProfile && (role === 'admin' || role === 'committee');
  
  return (
    <motion.div 
      className={styles.profileContent}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Pending Update Notification Banner */}
      {isMyProfile && pendingNotification && (
        <motion.div 
          className={styles.notificationBanner}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.notificationContent}>
            <AlertTriangle size={20} className={styles.notificationIcon} />
            <div>
              <strong>Profile Update Requested</strong>
              <p>A committee member has requested you to update your profile because it may be incomplete. Please review and update your information.</p>
            </div>
          </div>
          <div className={styles.notificationActions}>
            <button 
              className={styles.notificationUpdateBtn}
              onClick={handleEditProfile}
            >
              <Pencil size={14} /> Update Now
            </button>
            <button 
              className={styles.notificationDismissBtn}
              onClick={handleDismissNotification}
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Profile Hero */}
      <div className={styles.profileHero}>
        <motion.div 
          className={styles.profilePhoto}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.profilePhotoInitials} style={{ backgroundColor: getAvatarColor(member.name) }}>
            {initials}
          </div>
        </motion.div>
        <div className={styles.profileHeroInfo}>
          <motion.p 
            className={styles.verifiedLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {member.active ? 'Verified Member' : 'Member'}
          </motion.p>
          <motion.h1 
            className={styles.profileName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {firstName}<br />
            <span className={styles.profileNameItalic}>{lastName}</span>
          </motion.h1>
          <motion.p 
            className={styles.profileBio}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            A valued member of the KVO Nagpur community.
          </motion.p>
          <div className={styles.profileActions}>
            {/* Edit Profile — only on your own profile */}
            {canEdit && (
              <motion.button 
                className={styles.editProfileBtn} 
                onClick={handleEditProfile}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Pencil size={16} /> Edit Profile
              </motion.button>
            )}
            {/* Request Update — only for committee/admin viewing someone else */}
            {isCommitteeViewingOther && (
              <motion.button 
                className={styles.requestUpdateBtn} 
                onClick={handleRequestUpdate}
                disabled={isRequestingUpdate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send size={16} /> {isRequestingUpdate ? 'Sending...' : 'Request Update'}
              </motion.button>
            )}
            {isMyProfile && (
              <motion.button 
                className={styles.privacyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye size={16} /> View Privacy Settings
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className={styles.infoGrid}>
        {/* Personal Info */}
        <motion.div 
          className={styles.infoCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Personal</span>
          </div>
          <div className={styles.infoLabel}>Origin Kutch Town</div>
          <div className={styles.infoValue}>{member.kutch_town || 'Not specified'}</div>
          <div className={styles.infoLabel}>Marital Status</div>
          <div className={styles.infoValue}>{member.marital_status || 'Not specified'}</div>
          <div className={styles.infoLabel}>Family Members</div>
          <div className={styles.infoValue}>{(member.family_members || []).join(', ') || 'None listed'}</div>
        </motion.div>

        {/* Professional Standing */}
        <motion.div 
          className={styles.infoCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Professional Standing</span>
            <CheckCircle2 size={16} className={styles.verifiedIcon} />
          </div>
          <div className={styles.infoLabel}>Current Occupation</div>
          <div className={`${styles.infoValue} ${styles.infoValueLarge}`}>
            {member.occupation || 'Not specified'}
          </div>
          <div className={styles.separator} />
          <div className={styles.infoLabel}>Current Residence</div>
          <div className={styles.infoValue}>{member.current_place || 'Not specified'}</div>
        </motion.div>
      </div>

      {/* Contact Info */}
      <motion.div 
        className={styles.contactCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionDash} />
          <span className={styles.sectionTitle}>Contact</span>
        </div>
        <div className={styles.contactRow}>
          <Mail size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Email Address</div>
            <div className={styles.contactValue}>{member.email || 'Not available'}</div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <Phone size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Phone Number</div>
            <div className={styles.contactValue}>
              {member.contact_numbers?.length 
                ? member.contact_numbers.join(', ')
                : member.contact_no 
                  ? member.contact_no 
                  : <span style={{ fontStyle: 'italic', color: '#666' }}>Number is private</span>
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visibility Banner */}
      <motion.div 
        className={styles.visibilityBanner}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility ({member.contact_visibility})</h3>
          <p className={styles.visibilityText}>
            Depending on privacy settings, contact numbers are only visible to the profile owner or if explicitly marked public.
          </p>
        </div>
      </motion.div>

      {/* Logout Button */}
      {isMyProfile && (
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <motion.button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 24px', background: 'var(--color-bg-card)', 
              border: '1px solid var(--color-border)', borderRadius: '8px', 
              color: '#dc2626', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      )}

      {isUpdateModalOpen && (
        <ProfileUpdateModal 
          member={member} 
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdated={handleProfileUpdated}
          mode={updateModalMode}
        />
      )}
    </motion.div>
  );
}
