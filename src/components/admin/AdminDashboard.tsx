'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Calendar, Wallet, Settings, HelpCircle, LogOut, 
  Search, FileText, Download, UserPlus, TrendingUp, ClipboardList, 
  ShieldCheck, Pencil, MoreVertical, User, ChevronDown
} from 'lucide-react';
import styles from './AdminDashboard.module.css';
import Pagination from '@/components/ui/Pagination/Pagination';
import Footer from '@/components/layout/Footer/Footer';
import MemberFormModal from './MemberFormModal';
import { mockMembers as initialMembers, mockStats } from '@/data/mock';

const avatarColors = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

export default function AdminDashboard() {
  const [members, setMembers] = useState(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      router.push('/login');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Profession', 'Join Date', 'Status'];
    const csvData = members.map(m => [m.idNumber, m.name, m.email, m.profession, m.joinDate, m.status].join(',')).join('\n');
    const blob = new Blob([[headers.join(','), csvData].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kjo_samaj_members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Exporting Directory Data... Successfully downloaded.');
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Processing ${file.name}... Success! 12 new members pending verification.`);
    }
  };

  const handleAddMember = (newMember: any) => {
    const id = (members.length + 1).toString();
    const fullMember = {
      ...newMember,
      id,
      idNumber: `KJO-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
    };
    setMembers([fullMember, ...members]);
    alert('Member record created successfully.');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.profession.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableMembers = filteredMembers.slice(0, 5);

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
            <User size={20} color="var(--color-primary)" />
          </div>
          <div>
            <div className={styles.sidebarProfileName}>Admin Panel</div>
            <div className={styles.sidebarProfileRole}>Samaj Committee</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
            <LayoutDashboard size={18} className={styles.sidebarItemIcon} />
            Dashboard
          </button>
          <a href="/members" className={styles.sidebarItem}>
            <Users size={18} className={styles.sidebarItemIcon} />
            Member Requests
          </a>
          <a href="/events" className={styles.sidebarItem}>
            <Calendar size={18} className={styles.sidebarItemIcon} />
            Events
          </a>
          <button className={`${styles.sidebarItem} ${styles.sidebarItemDisabled}`} disabled>
            <Wallet size={18} className={styles.sidebarItemIcon} />
            Finance
            <span className={styles.comingSoonBadge}>Soon</span>
          </button>
          <a href="/settings" className={styles.sidebarItem}>
            <Settings size={18} className={styles.sidebarItemIcon} />
            Settings
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.broadcastBtn} onClick={() => alert('Message broadcasted to 14,802 members successfully.')}>
            Broadcast Message
          </button>
          <button className={styles.sidebarLink} onClick={() => alert('Opening Help Center... Please call +91 98200 54321 for urgent support.')}>
            <HelpCircle size={16} /> Help Center
          </button>
          <button className={styles.sidebarLink} onClick={handleLogout}>
            <LogOut size={16} /> Logout
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
              <Search size={16} color="var(--color-text-muted)" />
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
            }} onClick={() => router.push('/login')}>
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
            }} onClick={() => router.push('/login')}>
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
                  <ClipboardList size={14} className={styles.pageLabelIcon} />
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleBulkUpload}
                  style={{ display: 'none' }}
                  accept=".csv"
                />
                <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
                  <FileText size={16} /> Bulk Upload (CSV)
                </button>
                <button className={styles.actionBtn} onClick={handleExportCSV}>
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
            <button 
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlus size={16} /> Add New Member
            </button>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statsCard}>
              <div className={styles.statsCardLabel}>Total Members</div>
              <div className={styles.statsCardValue}>{mockStats.totalMembers.toLocaleString()}</div>
              <div className={styles.statsCardTrend}>
                <TrendingUp size={14} /> +12% vs last month
              </div>
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
              <Search size={18} className={styles.filterIcon} />
              <input 
                type="text" 
                placeholder="Search member repository..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <button className={styles.actionsBtn} aria-label="More actions">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className={styles.tableFooter}>
            <span className={styles.showingText}>
              Showing <span className={styles.showingBold}>1-{tableMembers.length}</span> of <span className={styles.showingBold}>{filteredMembers.length}</span> members
            </span>
            <Pagination currentPage={1} totalPages={Math.ceil(filteredMembers.length / 5)} />
          </div>

          <MemberFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleAddMember}
          />

          {/* Bottom Grid: Access Control + Heritage Card */}
          <div className={styles.bottomGrid}>
            <div className={styles.accessCard}>
              <h3 className={styles.accessTitle}>Access Control Summary</h3>
              <p className={styles.accessDescription}>
                Review the current distribution of committee roles and
                administrative privileges.
              </p>
              <div className={styles.accessRow}>
                <ShieldCheck size={18} className={styles.accessRowIcon} />
                <span className={styles.accessRowLabel}>Full Admin Access</span>
                <span className={styles.accessRowBadge}>05 Seats</span>
              </div>
              <div className={styles.accessRow}>
                <Pencil size={18} className={styles.accessRowIcon} />
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
