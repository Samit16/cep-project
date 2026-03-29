'use client';

import React from 'react';
import styles from './AdminDashboard.module.css';
import Pagination from '@/components/ui/Pagination/Pagination';
import Footer from '@/components/layout/Footer/Footer';
import { mockMembers, mockStats } from '@/data/mock';

const avatarColors = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

export default function AdminDashboard() {
  const tableMembers = mockMembers.slice(6, 9); // VS, MP, RK from mock data

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>KJO Samaj</div>
          <div className={styles.sidebarLogoSub}>Admin Panel</div>
        </div>

        <div className={styles.sidebarProfile}>
          <div className={styles.sidebarAvatar}>
            <span style={{ fontSize: '1.2rem' }}>👤</span>
          </div>
          <div>
            <div className={styles.sidebarProfileName}>Admin Panel</div>
            <div className={styles.sidebarProfileRole}>Samaj Committee</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
            <span className={styles.sidebarItemIcon}>📊</span>
            Dashboard
          </button>
          <a href="/members" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>👥</span>
            Member Requests
          </a>
          <a href="/events" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>📅</span>
            Events
          </a>
          <button className={`${styles.sidebarItem} ${styles.sidebarItemDisabled}`} disabled>
            <span className={styles.sidebarItemIcon}>💰</span>
            Finance
            <span className={styles.comingSoonBadge}>Soon</span>
          </button>
          <a href="/settings" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>⚙️</span>
            Settings
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.broadcastBtn}>Broadcast Message</button>
          <button className={styles.sidebarLink}>
            <span>❓</span> Help Center
          </button>
          <button className={styles.sidebarLink}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}
        <div className={styles.adminTopBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.committeeLabel}>
              Committee<br />Overview
            </div>
            <nav className={styles.topBarNav}>
              <a href="#" className={`${styles.topBarLink} ${styles.topBarLinkActive}`}>Directory</a>
              <a href="#" className={styles.topBarLink}>About</a>
              <a href="#" className={styles.topBarLink}>Achievements</a>
            </nav>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--color-bg-section-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
            }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search members..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.875rem',
                  width: '140px',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
          <div className={styles.topBarRight}>
            <button style={{
              padding: '8px 16px',
              border: '1.5px solid var(--color-primary)',
              color: 'var(--color-primary)',
              background: 'transparent',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}>
              Member Login
            </button>
            <button style={{
              padding: '8px 16px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}>
              Join Us
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className={styles.dashboardContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderTop}>
              <div>
                <p className={styles.pageLabel}>
                  <span className={styles.pageLabelIcon}>📋</span>
                  Samaj Repository
                </p>
                <h1 className={styles.pageTitle}>Member Directory</h1>
                <p className={styles.pageDescription}>
                  Manage and audit the complete heritage database of the
                  Kutchi Jain Oswal Samaj members. Professional records and
                  verified status tracking.
                </p>
              </div>
              <div className={styles.pageActions}>
                <button className={styles.actionBtn}>
                  📄 Bulk Upload (CSV)
                </button>
                <button className={styles.actionBtn}>
                  📥 Export Data
                </button>
              </div>
            </div>
            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
              ➕ Add New Member
            </button>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statsCard}>
              <div className={styles.statsCardLabel}>Total Members</div>
              <div className={styles.statsCardValue}>{mockStats.totalMembers.toLocaleString()}</div>
              <div className={styles.statsCardTrend}>📈 +12% vs last month</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsCardLabel}>Verified Professionals</div>
              <div className={styles.statsCardValue}>{mockStats.verifiedProfessionals.toLocaleString()}</div>
              <div className={styles.statsCardSub}>72% Data Completion</div>
            </div>
            <div className={styles.statsCard} style={{ borderLeftColor: '#EA580C' }}>
              <div className={styles.statsCardLabel}>New Applications</div>
              <div className={styles.statsCardValue}>{mockStats.newApplications}</div>
              <div className={styles.statsCardSub} style={{ color: '#EA580C', fontWeight: 600 }}>Requires immediate review</div>
            </div>
            <div className={styles.statsCard} style={{ borderLeftColor: '#C8956C' }}>
              <div className={styles.statsCardLabel}>Global Chapters</div>
              <div className={styles.statsCardValue}>{mockStats.globalChapters}</div>
              <div className={styles.statsCardSub}>Across 8 Countries</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterInput}>
              <span className={styles.filterIcon}>⚙️</span>
              <input type="text" placeholder="Filter members..." />
            </div>
            <select className={styles.filterSelect}>
              <option>All Professions</option>
            </select>
            <div className={styles.sortLabel}>
              Sort by: <span className={styles.sortValue}>Join Date ▾</span>
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.dataTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>Member Details</div>
              <div className={styles.tableHeaderCell}>ID Number</div>
              <div className={styles.tableHeaderCell}>Profession</div>
              <div className={styles.tableHeaderCell}>Join Date</div>
              <div className={styles.tableHeaderCell}>Status</div>
              <div className={styles.tableHeaderCell}>Actions</div>
            </div>
            {tableMembers.map((member, index) => (
              <div key={member.id} className={styles.tableRow}>
                <div className={styles.memberCell}>
                  <div
                    className={styles.memberAvatar}
                    style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.memberCellName}>{member.name}</div>
                    <div className={styles.memberCellEmail}>{member.email}</div>
                  </div>
                </div>
                <div className={styles.cellText}>{member.idNumber}</div>
                <div>
                  <span className={styles.professionBadge}>{member.profession}</span>
                </div>
                <div className={styles.cellText}>{member.joinDate}</div>
                <div>
                  <span className={`${styles.statusBadge} ${member.status === 'verified' ? styles.statusVerified : styles.statusPending}`}>
                    <span className={styles.statusDot} />
                    {member.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <button className={styles.actionsBtn} aria-label="More actions">⋮</button>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className={styles.tableFooter}>
            <span className={styles.showingText}>
              Showing <span className={styles.showingBold}>1-3</span> of <span className={styles.showingBold}>14,802</span> members
            </span>
            <Pagination currentPage={1} totalPages={12} />
          </div>

          {/* Bottom Grid: Access Control + Heritage Card */}
          <div className={styles.bottomGrid}>
            <div className={styles.accessCard}>
              <h3 className={styles.accessTitle}>Access Control Summary</h3>
              <p className={styles.accessDescription}>
                Review the current distribution of committee roles and
                administrative privileges.
              </p>
              <div className={styles.accessRow}>
                <span className={styles.accessRowIcon}>🛡️</span>
                <span className={styles.accessRowLabel}>Full Admin Access</span>
                <span className={styles.accessRowBadge}>05 Seats</span>
              </div>
              <div className={styles.accessRow}>
                <span className={styles.accessRowIcon}>✏️</span>
                <span className={styles.accessRowLabel}>Editor / Verifier</span>
                <span className={styles.accessRowBadge}>12 Seats</span>
              </div>
            </div>

            <div className={styles.heritageCard}>
              <img src="/images/heritage.png" alt="Preserving Heritage" />
              <div className={styles.heritageOverlay}>
                <h3 className={styles.heritageTitle}>Preserving Heritage</h3>
                <p className={styles.heritageText}>
                  Every record entered strengthens our community&apos;s digital
                  foundation for the next generation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
