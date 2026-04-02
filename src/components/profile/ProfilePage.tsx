'use client';

import React from 'react';
import { Pencil, Eye, ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { mockMembers } from '@/data/mock';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ProfilePageProps {
  memberId?: string;
}

export default function ProfilePage({ memberId = '1' }: ProfilePageProps) {
  const member = mockMembers.find(m => m.id === memberId) || mockMembers[0];
  const nameParts = member.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  const initials = member.name.split(' ').map(n => n[0]).join('');

  return (
    <div className={styles.profileContent}>
      {/* Profile Hero */}
      <div className={styles.profileHero}>
        <div className={styles.profilePhoto}>
          <div className={styles.profilePhotoInitials} style={{ backgroundColor: getAvatarColor(member.name) }}>
            {initials}
          </div>
        </div>
        <div className={styles.profileHeroInfo}>
          <p className={styles.verifiedLabel}>
            {member.status === 'verified' ? 'Verified Member' : 'Member'}
          </p>
          <h1 className={styles.profileName}>
            {firstName}<br />
            <span className={styles.profileNameItalic}>{lastName}</span>
          </h1>
          <p className={styles.profileBio}>
            {member.bio || 'A valued member of the Kutchi Jain Oswal Samaj community.'}
          </p>
          <div className={styles.profileActions}>
            <button className={styles.editProfileBtn}>
              <Pencil size={16} /> Edit Profile
            </button>
            <button className={styles.privacyBtn}>
              <Eye size={16} /> View Privacy Settings
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className={styles.infoGrid}>
        {/* Personal Info */}
        <div className={styles.infoCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Personal</span>
          </div>
          <div className={styles.infoLabel}>Date of Birth</div>
          <div className={styles.infoValue}>{member.dateOfBirth || 'Not specified'}</div>
          <div className={styles.infoLabel}>Education</div>
          <div className={styles.infoValue}>{member.education || 'Not specified'}</div>
        </div>

        {/* Professional Standing */}
        <div className={styles.infoCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDash} />
            <span className={styles.sectionTitle}>Professional Standing</span>
            <CheckCircle2 size={16} className={styles.verifiedIcon} />
          </div>
          <div className={styles.infoLabel}>Current Occupation</div>
          <div className={`${styles.infoValue} ${styles.infoValueLarge}`}>
            {member.profession}
          </div>
          <div className={styles.separator} />
          <div className={styles.infoLabel}>Company</div>
          <div className={styles.infoValue}>{member.company || 'Not specified'}</div>
          
          {member.officeLocation && (
            <div className={styles.officePhoto}>
              <div className={styles.officeBadge}>
                <div className={styles.officeBadgeLabel}>Office Headquarters</div>
                <div className={styles.officeBadgeValue}>{member.officeLocation}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.contactCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionDash} />
          <span className={styles.sectionTitle}>Contact</span>
        </div>
        <div className={styles.contactRow}>
          <Mail size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Email Address</div>
            <div className={styles.contactValue}>{member.email}</div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <Phone size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Phone Number</div>
            <div className={styles.contactValue}>{member.phone || 'Not available'}</div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <MapPin size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Residential Address</div>
            <div className={styles.contactValue}>{member.address || 'Not available'}</div>
          </div>
        </div>
      </div>

      {/* Expertise & Contributions */}
      <div className={styles.expertiseSection}>
        <h3 className={styles.expertiseTitle}>Expertise &amp; Contributions</h3>
        <div className={styles.expertiseTags}>
          {(member.expertise || ['Community Member']).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Visibility Banner */}
      <div className={styles.visibilityBanner}>
        <ShieldCheck size={24} className={styles.visibilityIcon} />
        <div>
          <h3 className={styles.visibilityTitle}>Member Directory Visibility</h3>
          <p className={styles.visibilityText}>
            Your profile is currently visible to verified community members only. You
            can adjust your visibility preferences in the privacy settings panel.
          </p>
        </div>
        <a href="/privacy" className={styles.visibilityLink}>
          Go to Privacy Dashboard &gt;
        </a>
      </div>
    </div>
  );
}
