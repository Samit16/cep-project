'use client';

import React from 'react';
import { Pencil, Eye, ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { mockMembers } from '@/data/mock';

interface ProfilePageProps {
  memberId?: string;
}

export default function ProfilePage({ memberId = '1' }: ProfilePageProps) {
  const member = mockMembers.find(m => m.id === memberId) || mockMembers[0];
  const nameParts = member.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div className={styles.profileContent}>
      {/* Profile Hero */}
      <div className={styles.profileHero}>
        <div className={styles.profilePhoto}>
          {member.photoUrl ? (
            <img src={`/images/members/member${member.id}.jpg`} alt={member.name} />
          ) : (
            <div className={styles.profilePhotoInitials}>
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
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
            {member.bio || 'Preserving the traditions of our community while innovating for the future of the Kutchi Jain Oswal Samaj.'}
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
          <div className={styles.infoValue}>{member.dateOfBirth || '14th September, 1978'}</div>
          <div className={styles.infoLabel}>Education</div>
          <div className={styles.infoValue}>{member.education || 'MBA, Finance\nUniversity of Mumbai'}</div>
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
          <div className={styles.infoValue}>{member.company || 'Kothari Textiles & Logistics Pvt Ltd.'}</div>
          
          <div className={styles.officePhoto}>
            <img src="/images/office1.jpg" alt="Office headquarters" />
            <div className={styles.officeBadge}>
              <div className={styles.officeBadgeLabel}>Office Headquarters</div>
              <div className={styles.officeBadgeValue}>{member.officeLocation || 'Bandra-Kurla Complex, Mumbai'}</div>
            </div>
          </div>
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
            <div className={styles.contactValue}>{member.phone || '+91 98200 12345'}</div>
          </div>
        </div>
        <div className={styles.contactRow}>
          <MapPin size={18} className={styles.contactIcon} />
          <div>
            <div className={styles.contactLabel}>Residential Address</div>
            <div className={styles.contactValue}>{member.address || '402, Heritage Residency, Marine Drive, Mumbai, 400020'}</div>
          </div>
        </div>
      </div>

      {/* Expertise & Contributions */}
      <div className={styles.expertiseSection}>
        <h3 className={styles.expertiseTitle}>Expertise &amp; Contributions</h3>
        <div className={styles.expertiseTags}>
          {(member.expertise || ['Strategic Planning', 'Philanthropy', 'Supply Chain', 'Legacy Textiles']).map((tag) => (
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
