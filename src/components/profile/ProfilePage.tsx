'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Pencil, Eye, ShieldCheck, Mail, Phone, CheckCircle2, LogOut, AlertTriangle, X, Send } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import { Member } from '@/types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name?: string) {
  let hash = 0;
  const n = name || '';
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash);
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

  // GSAP animation ref
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
      await new Promise(resolve => setTimeout(resolve, 150));
      window.location.href = '/home';
    } catch {
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

  // Progressive entrance animation
  useGSAP(() => {
    if (!profileRef.current || isLoading || !member) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const items = profileRef.current.querySelectorAll('.gsap-profile-anim');
    gsap.fromTo(items,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'expo.out',
        clearProps: 'transform,opacity',
      }
    );
  }, { scope: profileRef, dependencies: [member, isLoading] });

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

  const firstName = member.first_name || '';
  const middleName = member.middle_name ? member.middle_name + ' ' : '';
  const lastName = member.last_name || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

  const canEdit = isMyProfile;
  const isCommitteeViewingOther = !isMyProfile && (role === 'admin' || role === 'committee');
  
  return (
    <div ref={profileRef} className={styles.profileContent}>
      {/* Pending Update Notification Banner */}
      {isMyProfile && pendingNotification && (
        <div className={`${styles.notificationBanner} gsap-profile-anim`}>
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
        </div>
      )}

      {/* Profile Hero */}
      <div className={`${styles.profileHero} gsap-profile-anim`}>
        <div className={styles.profilePhoto}>
          <div className={styles.profilePhotoInitials} style={{ backgroundColor: getAvatarColor(member.name) }}>
            {initials}
          </div>
        </div>
        <div className={styles.profileHeroInfo}>
          <p className={styles.verifiedLabel}>
            {member.active ? 'Verified Member' : 'Member'}
          </p>
          <h1 className={styles.profileName}>
            {firstName} {middleName}<br />
            <span className={styles.profileNameItalic}>{lastName}</span>
          </h1>
          <p className={styles.profileBio}>
            A valued member of the KVO Nagpur community.
          </p>
          <div className={styles.profileActions}>
            {/* Edit Profile — only on your own profile */}
            {canEdit && (
              <button className={styles.editProfileBtn} onClick={handleEditProfile}>
                <Pencil size={16} /> Edit Profile
              </button>
            )}
            {/* Request Update — only for committee/admin viewing someone else */}
            {isCommitteeViewingOther && (
              <button 
                className={styles.requestUpdateBtn} 
                onClick={handleRequestUpdate}
                disabled={isRequestingUpdate}
              >
                <Send size={16} /> {isRequestingUpdate ? 'Sending...' : 'Request Update'}
              </button>
            )}
            {isMyProfile && (
              <button className={styles.privacyBtn}>
                <Eye size={16} /> View Privacy Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className={styles.infoGrid}>
        {/* Personal Info */}
        <div className={`${styles.infoCard} gsap-profile-anim`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Personal</span>
          </div>
          <div className={styles.infoLabel}>Origin Kutch Town</div>
          <div className={styles.infoValue}>{member.kutch_town || 'Not specified'}</div>
          <div className={styles.infoLabel}>Nukh</div>
          <div className={styles.infoValue}>{member.nukh || 'Not specified'}</div>
          <div className={styles.infoLabel}>Birthplace</div>
          <div className={styles.infoValue}>{member.birthplace || 'Not specified'}</div>
          <div className={styles.infoLabel}>Marital Status</div>
          <div className={styles.infoValue}>{member.marital_status || 'Not specified'}</div>
          <div className={styles.infoLabel}>Family Members</div>
          <div className={styles.infoValue}>{(member.family_members || []).join(', ') || 'None listed'}</div>
          
          <div className={styles.infoLabel}>Family Relations</div>
          <div className={styles.infoValue}>
            {member.relations && member.relations.length > 0 
              ? member.relations.map(r => `${r.name} (${r.relation})`).join(', ') 
              : 'None listed'}
          </div>
        </div>

        {/* Professional Standing */}
        <div className={`${styles.infoCard} gsap-profile-anim`}>
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
        </div>
      </div>

      {/* Contact Info */}
      <div className={`${styles.contactCard} gsap-profile-anim`}>
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
      </div>

      {/* Visibility Banner */}
      <div className={`${styles.visibilityBanner} gsap-profile-anim`}>
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility ({member.contact_visibility})</h3>
          <p className={styles.visibilityText}>
            Depending on privacy settings, contact numbers are only visible to the profile owner or if explicitly marked public.
          </p>
        </div>
      </div>

      {/* Logout Button */}
      {isMyProfile && (
        <div className="gsap-profile-anim" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 24px', background: 'var(--color-bg-card)', 
              border: '1px solid var(--color-border)', borderRadius: '8px', 
              color: '#dc2626', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
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
    </div>
  );
}
