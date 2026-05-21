'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Eye, ShieldCheck, Mail, Phone, CheckCircle2, LogOut, AlertTriangle, X, Send, KeyRound, Settings, UserPlus, Users, MessageSquare } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import FamilyMemberModal from './FamilyMemberModal';
import ChangePasswordModal from './ChangePasswordModal';
import VerifyEmailModal from './VerifyEmailModal';
import VerifyWhatsAppModal from './VerifyWhatsAppModal';
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
  // `member` is the main logged in user (or the main profile being viewed)
  const [member, setMember] = useState<Member | null>(null);
  
  // New state for Family Dashboard
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  
  // Legacy modal state for non-family updates or requests
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalMode, setUpdateModalMode] = useState<'self-update' | 'request-update'>('self-update');
  
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingNotification, setPendingNotification] = useState<any>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<'verify' | 'change'>('verify');
  const [isVerifyWhatsAppModalOpen, setIsVerifyWhatsAppModalOpen] = useState(false);
  
  const { profile, role, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    router.replace('/home');
    logout();
  };

  const isMyProfile = !memberId || memberId === 'me' || profile?.member_id === (member?._id || member?.id);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = memberId && memberId !== 'me' ? `/members/${memberId}` : '/members/me';
      const data = await ApiClient.get<Member>(endpoint);
      setMember(data);
      setSelectedMember(data);

      // If it's my profile, fetch the whole family
      if (!memberId || memberId === 'me' || profile?.member_id === data.id) {
        try {
          const familyData = await ApiClient.get<{ members: Member[] }>('/members/family');
          setFamilyMembers(familyData.members || []);
        } catch (e) {
          console.error("Failed to fetch family members", e);
        }
      }
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [memberId, profile?.member_id, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useGSAP(() => {
    if (!profileRef.current || isLoading || !selectedMember) return;
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
  }, { scope: profileRef, dependencies: [selectedMember, isLoading] });

  useEffect(() => {
    if (!isMyProfile) return;
    
    async function checkNotifications() {
      try {
        interface Notification {
          type: string;
          is_read: boolean;
        }
        const data = await ApiClient.get<{ notifications: Notification[] }>('/members/me/notifications');
        const profileUpdateNotif = data.notifications?.find(n => n.type === 'profile_update' && !n.is_read);
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

  const handleRequestUpdate = async () => {
    const targetId = selectedMember?._id || selectedMember?.id;
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

  const handleEditProfile = () => {
    setUpdateModalMode('self-update');
    setIsUpdateModalOpen(true);
  };

  const handleEditFamilyMember = (m: Member) => {
    setEditingMember(m);
    setIsFamilyModalOpen(true);
  };

  const handleAddFamilyMember = () => {
    setEditingMember(null);
    setIsFamilyModalOpen(true);
  };

  const handleFamilyMemberSaved = (savedMember: Member) => {
    // Update local state
    if (editingMember) {
      // It was an edit
      setFamilyMembers(prev => prev.map(m => m.id === savedMember.id ? savedMember : m));
      if (selectedMember?.id === savedMember.id) {
        setSelectedMember(savedMember);
      }
      if (member?.id === savedMember.id) {
        setMember(savedMember);
      }
    } else {
      // It was an add
      setFamilyMembers(prev => [...prev, savedMember]);
      setSelectedMember(savedMember);
    }
    
    if (pendingNotification && savedMember.id === member?.id) {
      handleDismissNotification();
    }
    
    // Check if email needs verification (only for the main logged-in user)
    if (savedMember.id === member?.id && savedMember.email && !savedMember.email_verified) {
      setEmailModalMode('verify');
      setIsVerifyEmailModalOpen(true);
    }
  };

  const handlePrivacyChange = async (visibility: 'public' | 'private') => {
    if (!selectedMember) return;
    try {
      // Assume updating visibility applies to the selected member via PUT family
      await ApiClient.put(`/members/family/${selectedMember.id}`, {
        contact_visibility: visibility
      });
      setSelectedMember(prev => prev ? { ...prev, contact_visibility: visibility } : prev);
      setFamilyMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, contact_visibility: visibility } : m));
      toast(`Profile is now ${visibility}`, 'success');
      setShowSettingsMenu(false);
    } catch {
      toast('Failed to update privacy settings', 'error');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!selectedMember) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Profile unavailable.</div>;
  }

  const displayMember = selectedMember;
  const firstName = displayMember.first_name || '';
  const middleName = displayMember.middle_name ? displayMember.middle_name + ' ' : '';
  const lastName = displayMember.last_name || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

  const isCommitteeViewingOther = !isMyProfile && (role === 'admin' || role === 'committee');
  // True if the user is looking at their own personal record within the family
  const isSelectedMyOwn = isMyProfile && displayMember.id === member?.id;

  const renderProfileDetail = () => (
    <div className={styles.detailPanel}>
      {/* Pending Update Notification Banner */}
      {isSelectedMyOwn && pendingNotification && (
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
              onClick={() => handleEditFamilyMember(displayMember)}
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
          <div className={styles.profilePhotoInitials} style={{ backgroundColor: getAvatarColor(displayMember.name) }}>
            {initials}
          </div>
        </div>
        <div className={styles.profileHeroInfo}>
          <p className={styles.verifiedLabel}>
            {displayMember.active ? 'Verified Member' : 'Member'}
          </p>
          <h1 className={styles.profileName}>
            {firstName} {middleName}<br />
            <span className={styles.profileNameItalic}>{lastName}</span>
          </h1>
          <p className={styles.profileBio}>
            A valued member of the KVO Nagpur community.
          </p>
          <div className={styles.profileActions}>
            {/* Edit Profile — only if managing own family */}
            {isMyProfile && (
              <button className={styles.editProfileBtn} onClick={() => handleEditFamilyMember(displayMember)}>
                <Pencil size={16} /> Edit Member
              </button>
            )}
            
            {/* Request Update — only for committee viewing someone else */}
            {isCommitteeViewingOther && (
              <button 
                className={styles.requestUpdateBtn} 
                onClick={handleRequestUpdate}
                disabled={isRequestingUpdate}
              >
                <Send size={16} /> {isRequestingUpdate ? 'Sending...' : 'Request Update'}
              </button>
            )}
            
            {/* Settings drop down - only available for the primary logged in user's own profile */}
            {isSelectedMyOwn && (
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
                      onClick={() => { handlePrivacyChange('public'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <Eye size={14} /> Make Profile Public
                    </button>
                    <button 
                      onClick={() => { handlePrivacyChange('private'); }}
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
                      onClick={() => { setEmailModalMode('verify'); setIsVerifyEmailModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <CheckCircle2 size={14} /> Verify Email
                    </button>
                    <button 
                      onClick={() => { setIsVerifyWhatsAppModalOpen(true); setShowSettingsMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}
                    >
                      <MessageSquare size={14} /> Verify WhatsApp
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
          <div className={styles.infoValue}>{displayMember.kutch_town || 'Not specified'}</div>
          <div className={styles.infoLabel}>Nukh</div>
          <div className={styles.infoValue}>{displayMember.nukh || 'Not specified'}</div>
          <div className={styles.infoLabel}>Birthplace</div>
          <div className={styles.infoValue}>{displayMember.birthplace || 'Not specified'}</div>
          <div className={styles.infoLabel}>Marital Status</div>
          <div className={styles.infoValue}>{displayMember.marital_status || 'Not specified'}</div>
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
            {displayMember.occupation || 'Not specified'}
          </div>
          <div className={styles.separator} />
          <div className={styles.infoLabel}>Current Residence</div>
          <div className={styles.infoValue}>{displayMember.current_place || 'Not specified'}</div>
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
            <div className={styles.contactValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayMember.email || 'Not available'}
              {displayMember.email_verified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                isMyProfile && displayMember.email && (
                  <button
                    onClick={() => {
                      setEmailModalMode('verify');
                      setIsVerifyEmailModalOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(139, 26, 26, 0.08)',
                      border: '1px solid var(--color-primary)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.08)';
                    }}
                  >
                    Verify Email
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <Phone size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Phone Number</div>
            <div className={styles.contactValue}>
              {displayMember.contact_numbers?.length 
                ? displayMember.contact_numbers.join(', ')
                : displayMember.contact_no 
                  ? displayMember.contact_no 
                  : <span style={{ fontStyle: 'italic', color: '#666' }}>Number is private</span>
              }
            </div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <MessageSquare size={18} className={styles.contactIcon} style={{ color: '#25D366' }} />
          <div>
            <div className={styles.contactLabel}>WhatsApp Number</div>
            <div className={styles.contactValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayMember.whatsapp || 'Not available'}
              {displayMember.whatsapp_verified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                isMyProfile && displayMember.whatsapp && (
                  <button
                    onClick={() => {
                      setIsVerifyWhatsAppModalOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(139, 26, 26, 0.08)',
                      border: '1px solid var(--color-primary)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.08)';
                    }}
                  >
                    Verify WhatsApp
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visibility Banner */}
      <div className={`${styles.visibilityBanner} gsap-profile-anim`}>
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility ({displayMember.contact_visibility})</h3>
          <p className={styles.visibilityText}>
            {displayMember.contact_visibility === 'private' 
              ? 'Your profile is private, meaning some details are hidden, but your contact number and email remain public for the community.'
              : 'Your profile is fully public. All verified community members can view your details.'}
          </p>
        </div>
      </div>

      {/* Logout Button */}
      {isSelectedMyOwn && (
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
    </div>
  );

  return (
    <div ref={profileRef} className={styles.profileContent}>
      {isMyProfile && familyMembers.length > 0 ? (
        <div className={styles.dashboardLayout}>
          {/* Left Sidebar: Family Members List */}
          <div className={`${styles.familySidebar} gsap-profile-anim`}>
            <div className={styles.familySidebarHeader}>
              <h2 className={styles.familySidebarTitle}>Family Dashboard</h2>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            
            <div className={styles.familyList}>
              {familyMembers.map((fm) => (
                <button 
                  key={fm.id}
                  className={`${styles.familyMemberItem} ${selectedMember?.id === fm.id ? styles.active : ''}`}
                  onClick={() => setSelectedMember(fm)}
                >
                  <div className={styles.familyMemberAvatar} style={{ backgroundColor: getAvatarColor(fm.name) }}>
                    {`${fm.first_name?.[0] || ''}${fm.last_name?.[0] || ''}`}
                  </div>
                  <div className={styles.familyMemberInfo}>
                    <div className={styles.familyMemberName}>{fm.name || `${fm.first_name} ${fm.last_name}`}</div>
                    <div className={styles.familyMemberRelation}>
                      {fm.id === member?.id ? 'Primary Account' : (fm.relation || 'Family Member')}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button className={styles.addMemberBtn} onClick={handleAddFamilyMember}>
              <UserPlus size={16} /> Add Family Member
            </button>
          </div>

          {/* Right Panel: Selected Member Details */}
          {renderProfileDetail()}
        </div>
      ) : (
        renderProfileDetail()
      )}

      {/* Modals */}
      {isFamilyModalOpen && (
        <FamilyMemberModal 
          member={editingMember} 
          isPrimary={editingMember?.id === member?.id}
          onClose={() => setIsFamilyModalOpen(false)}
          onSaved={handleFamilyMemberSaved}
        />
      )}

      {/* Legacy self-update modal (if needed elsewhere) */}
      {isUpdateModalOpen && !isMyProfile && (
        <ProfileUpdateModal 
          member={selectedMember} 
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdated={handleFamilyMemberSaved}
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
          mode={emailModalMode}
          initialEmail={selectedMember?.email}
          familyMemberId={isSelectedMyOwn ? undefined : selectedMember?.id}
          onClose={() => setIsVerifyEmailModalOpen(false)}
          onSuccess={(newEmail) => {
            if (!selectedMember) return;
            const updated = { ...selectedMember, email: newEmail, email_verified: true };
            setSelectedMember(updated);
            if (member?.id === selectedMember.id) {
               setMember(updated);
            }
            setFamilyMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
            setIsVerifyEmailModalOpen(false);
          }}
        />
      )}

      {isVerifyWhatsAppModalOpen && (
        <VerifyWhatsAppModal
          memberId={selectedMember.id || ''}
          initialWhatsApp={selectedMember.whatsapp}
          onClose={() => setIsVerifyWhatsAppModalOpen(false)}
          onSuccess={(newWhatsApp) => {
            if (!selectedMember) return;
            const updated = { ...selectedMember, whatsapp: newWhatsApp, whatsapp_verified: true };
            setSelectedMember(updated);
            if (member?.id === selectedMember.id) {
               setMember(updated);
            }
            setFamilyMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
            setIsVerifyWhatsAppModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
