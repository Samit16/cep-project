'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Eye, ShieldCheck, Mail, Phone, CheckCircle2, LogOut, AlertTriangle, X, Send, KeyRound, Settings } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import ChangePasswordModal from './ChangePasswordModal';
import VerifyEmailModal from './VerifyEmailModal';
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Notification state for pending update requests on own profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingNotification, setPendingNotification] = useState<any>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  
  const { profile, role, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // GSAP animation ref
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate immediately, cleanup runs in background
    router.replace('/home');
    logout();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await ApiClient.get<any>('/members/me/notifications');
        const profileUpdateNotif = data.notifications?.find((n: any) => n.type === 'profile_update' && !n.is_read);
        if (profileUpdateNotif) {
          setPendingNotification(profileUpdateNotif);
        }
      } catch {
        // Silently fail
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

  const handlePrivacyChange = async (visibility: 'public' | 'private') => {
    try {
      await ApiClient.put('/members/me', {
        contact_visibility: visibility
      });
      setMember(prev => prev ? { ...prev, contact_visibility: visibility } : prev);
      toast(`Profile is now ${visibility}`, 'success');
      setShowSettingsMenu(false);
    } catch (err) {
      toast('Failed to update privacy settings', 'error');
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
              <div style={{ position: 'relative' }}>
                <button className={styles.privacyBtn} onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
                  <Settings size={16} /> Settings
                </button>
                {showSettingsMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '220px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg-section-alt)' }}>
                      Privacy
                    </div>
                    <button 
                      onClick={() => { handlePrivacyChange('public'); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <Eye size={14} /> Make Profile Public
                    </button>
                    <button 
                      onClick={() => { handlePrivacyChange('private'); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <ShieldCheck size={14} /> Make Profile Private
                    </button>
                    
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg-section-alt)', borderTop: '1px solid var(--color-border)' }}>
                      Security
                    </div>
                    <button 
                      onClick={() => { setIsPasswordModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <KeyRound size={14} /> Change Password
                    </button>
                    <button 
                      onClick={() => { setIsVerifyEmailModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <Mail size={14} /> Verify Email
                    </button>
                  </div>
                )}
              </div>
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
            {member.contact_visibility === 'private' 
              ? 'Your profile is private, meaning some details are hidden, but your contact number and email remain public for the community.'
              : 'Your profile is fully public. All verified community members can view your details.'}
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

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {isVerifyEmailModalOpen && (
        <VerifyEmailModal
          onClose={() => setIsVerifyEmailModalOpen(false)}
          onSuccess={(newEmail) => {
            setMember(prev => prev ? { ...prev, email: newEmail } : prev);
            setIsVerifyEmailModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
