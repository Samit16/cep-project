'use client';

import React from 'react';
import styles from './DirectoryPage.module.css';
import { OverlayBadge } from '@/components/ui/Badge/Badge';
import Pagination from '@/components/ui/Pagination/Pagination';
import { mockMembers } from '@/data/mock';

export default function DirectoryPage() {
  const members = mockMembers.slice(0, 5); // Show first 5 for grid

  return (
    <div className={styles.directoryContent}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerLabel}>Community Network</p>
          <h1 className={styles.headerTitle}>Member Directory</h1>
          <p className={styles.headerDescription}>
            Connect with fellow community members across the globe. Access is
            exclusive to verified Samaj members.
          </p>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${styles.viewBtnActive}`}>
            ⊞ Grid
          </button>
          <button className={styles.viewBtn}>
            ☰ List
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Search by name or keyword..." />
        </div>
        <select className={styles.filterSelect}>
          <option>All Professions</option>
          <option>Chartered Accountant</option>
          <option>Pediatrician</option>
          <option>Software Engineer</option>
          <option>Business Owner</option>
        </select>
        <select className={styles.filterSelect}>
          <option>All Locations</option>
          <option>Mumbai, MH</option>
          <option>London, UK</option>
          <option>Ahmedabad, GJ</option>
          <option>Bangalore, KA</option>
        </select>
        <button className={styles.filterBtn} aria-label="Advanced filters">
          ⚙
        </button>
      </div>

      {/* Privacy Notice */}
      <div className={styles.privacyNotice}>
        <span className={styles.privacyIcon}>🛡️</span>
        Privacy-First: Sensitive contact information is hidden for security. Use &apos;Request Contact&apos; inside profiles for inquiries.
      </div>

      {/* Member Grid */}
      <div className={styles.memberGrid}>
        {members.map((member) => (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.memberCardImage}>
              {member.photoUrl ? (
                <img src={`/images/members/member${member.id}.png`} alt={member.name} />
              ) : (
                <div className={styles.memberCardInitials}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              {member.status === 'verified' && member.role === 'member' && (
                <OverlayBadge type="verified">Verified</OverlayBadge>
              )}
              {member.role === 'committee' && (
                <OverlayBadge type="committee">Committee</OverlayBadge>
              )}
            </div>
            <div className={styles.memberCardBody}>
              <h3 className={styles.memberCardName}>{member.name}</h3>
              <p className={styles.memberCardProfession}>{member.profession}</p>
              <p className={styles.memberCardLocation}>
                <span className={styles.locationIcon}>📍</span>
                {member.city}{member.state ? `, ${member.state}` : ''}{member.country && member.country !== 'India' ? `, ${member.country}` : ''}
              </p>
              <a href={`/directory/${member.id}`} className={styles.viewProfileBtn}>
                View Basic Profile
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.paginationWrapper}>
        <Pagination currentPage={1} totalPages={12} />
      </div>
    </div>
  );
}
