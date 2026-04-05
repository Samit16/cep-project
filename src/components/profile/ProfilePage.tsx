'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Eye, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, LogOut, Users, Calendar, Info, BookOpen } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ProfileSkeleton } from '@/components/ui/Skeleton/Skeleton';
import ProfileUpdateModal from './ProfileUpdateModal';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

interface MemberDetail {
  _id: string;
  name: string;
  contact_no?: string;
  email: string;
  occupation?: string;
  marital_status?: string;
  current_place?: string;
  kutch_town?: string;
  family_members?: string[];
  contact_visibility?: string;
  active?: boolean;
}

export default function ProfilePage({ memberId }: ProfilePageProps) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isOwnProfile = !memberId;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const endpoint = memberId ? `/members/${memberId}` : '/members/me';
        const data = await ApiClient.get<MemberDetail>(endpoint);
        setMember(data);
      } catch (err: any) {
        toast(err.message || 'Failed to load profile', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [memberId, toast]);

  const handleLogout = () => {
    logout();
    router.push('/');
    toast('Logged out successfully', 'success');
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

  const quickActions = [
    { icon: Users, label: 'Member Directory', description: 'Browse all community members', href: '/directory', color: '#2D5F8B' },
    { icon: Calendar, label: 'Community Events', description: 'Upcoming events & gatherings', href: '/events', color: '#4A7C59' },
    { icon: BookOpen, label: 'Archives', description: 'Heritage & past achievements', href: '/#archives', color: '#7B5EA7' },
    { icon: Info, label: 'About KVO', description: 'Our mission and history', href: '/about', color: '#D4763C' },
  ];
  
  return (
    <motion.div 
      className={styles.profileContent}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
            {member.active ? '● Verified Member' : '○ Member'}
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
          {isOwnProfile && (
            <div className={styles.profileActions}>
              <motion.button 
                className={styles.editProfileBtn} 
                onClick={() => setIsUpdateModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Pencil size={16} /> Request Update
              </motion.button>
              <motion.button 
                className={styles.privacyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye size={16} /> View Privacy Settings
              </motion.button>
            </div>
          )}
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
              {member.contact_no 
                ? member.contact_no 
                : <span style={{ fontStyle: 'italic', color: '#666' }}>Number is private</span>
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - only on own profile */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <div className={styles.sectionHeader} style={{ marginBottom: 'var(--space-6)' }}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Quick Actions</span>
          </div>
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
              >
                <Link href={action.href} className={styles.quickActionCard}>
                  <div className={styles.quickActionIcon} style={{ backgroundColor: `${action.color}12`, color: action.color }}>
                    <action.icon size={22} />
                  </div>
                  <div className={styles.quickActionInfo}>
                    <h4 className={styles.quickActionLabel}>{action.label}</h4>
                    <p className={styles.quickActionDesc}>{action.description}</p>
                  </div>
                  <span className={styles.quickActionArrow}>→</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Visibility Banner */}
      <motion.div 
        className={styles.visibilityBanner}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility ({member.contact_visibility})</h3>
          <p className={styles.visibilityText}>
            Depending on privacy settings, contact numbers are only visible to the profile owner or if explicitly marked public.
          </p>
        </div>
      </motion.div>

      {/* Logout Section - only on own profile */}
      {isOwnProfile && (
        <motion.div 
          className={styles.logoutSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className={styles.logoutSectionInner}>
            <div>
              <h4 className={styles.logoutTitle}>Sign Out</h4>
              <p className={styles.logoutDesc}>Sign out of your KVO Nagpur account on this device.</p>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}

      {isUpdateModalOpen && (
        <ProfileUpdateModal 
          member={member} 
          onClose={() => setIsUpdateModalOpen(false)} 
        />
      )}
    </motion.div>
  );
}
