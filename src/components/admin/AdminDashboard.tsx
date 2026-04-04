'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const avatarColors = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

interface MemberAdmin {
  _id: string;
  name: string;
  contact_no?: string;
  email: string;
  occupation?: string;
  current_place?: string;
  active: boolean;
  createdAt?: string;
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<MemberAdmin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { role, logout, isLoading } = useAuth();

  // Protect Admin Route
  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.push('/login');
    }
  }, [isLoading, role, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = useCallback(async () => {
    try {
      // In a real app we would paginate. For admin view demo, load items limit=20
      const data = await ApiClient.get<MemberAdmin[]>('/members', { limit: 20, name: debouncedSearch });
      setMembers(data);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch directory', 'error');
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    if (role === 'admin') loadMembers();
  }, [role, loadMembers]);

  // Polling for CSV Upload
  useEffect(() => {
    let interval: any;
    if (uploadJobId) {
      interval = setInterval(async () => {
        try {
          const status = await ApiClient.get<any>(`/admin/bulk-upload/${uploadJobId}/status`);
          setUploadStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setUploadJobId(null);
            toast(`Job finished. Processed: ${status.processed}, Success: ${status.success}, Errors: ${status.errors}`, status.status === 'completed' ? 'success' : 'error');
            loadMembers();
          }
        } catch (err) {
          clearInterval(interval);
          setUploadJobId(null);
          setUploadStatus(null);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [uploadJobId, toast, loadMembers]);


  const handleLogout = () => {
    logout();
  };

  const handleExportCSV = () => {
    // Basic mock export
    toast('Exporting Directory Data... Feature coming soon matching filters.', 'success');
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast(`Uploading ${file.name}...`, 'success');
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await ApiClient.post<{ jobId: string }>('/admin/members/bulk-upload', formData);
        setUploadJobId(res.jobId);
        toast('Upload started. Check polling status.', 'success');
      } catch (err: any) {
        toast(err.message || 'Upload failed', 'error');
      }
    }
  };

  const handleCommitImport = async () => {
    if (!uploadJobId) return;
    try {
      await ApiClient.post(`/admin/bulk-upload/${uploadJobId}/commit`, { dryRun: false });
      toast('Commit processing...', 'success');
    } catch (err: any) {
      toast(err.message || 'Commit failed', 'error');
    }
  };

  const handleAddMember = (newMember: any) => {
    toast('Member record creation directly via UI coming soon (use CSV now).', 'success');
    setIsModalOpen(false);
  };

  if (isLoading || role !== 'admin') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Admin Workspace...</div>;
  }

  const tableMembers = members.slice(0, 5);

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
        </nav>

        <div className={styles.sidebarFooter}>
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
              <a href="/" className={styles.topBarLink}>Home</a>
              <a href="/dashboard" className={`${styles.topBarLink} ${styles.topBarLinkActive}`}>Overview</a>
              <a href="/directory" className={styles.topBarLink}>Directory</a>
              <a href="/about" className={styles.topBarLink}>About</a>
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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className={styles.adminBadge}>Admin Session</div>
            <button className={styles.logoutBtnSmall} onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.dashboardStats}>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#fdf2f2' }}>
                <Users size={20} color="#8B1A1A" />
              </div>
              <span className={styles.statTrend}>
                <TrendingUp size={14} /> +12%
              </span>
            </div>
            <div className={styles.statValue}>{members.length}+</div>
            <div className={styles.statLabel}>Total Members Recorded</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4' }}>
                <ShieldCheck size={20} color="#16a34a" />
              </div>
            </div>
            <div className={styles.statValue}>
              {members.filter(m => m.active).length}
            </div>
            <div className={styles.statLabel}>Verified Community Members</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff' }}>
                <Calendar size={20} color="#2563eb" />
              </div>
            </div>
            <div className={styles.statValue}>
              {new Set(members.map(m => m.current_place).filter(Boolean)).size}
            </div>
            <div className={styles.statLabel}>Global Cities Represented</div>
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
                <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()} disabled={!!uploadJobId}>
                  <FileText size={16} /> Bulk Upload (CSV)
                </button>
                <button className={styles.actionBtn} onClick={handleExportCSV}>
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
            
            {uploadJobId && uploadStatus && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffecc9', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                <p><strong>Job Processing {uploadStatus.status}...</strong></p>
                <p>Processed: {uploadStatus.processed || 0} | Success: {uploadStatus.success || 0} | Errors: {uploadStatus.errors || 0}</p>
                {uploadStatus.status !== 'completed' && uploadStatus.status !== 'failed' && (
                   <button onClick={handleCommitImport} style={{ marginTop: '8px', padding: '4px 12px', background: '#1c1c1c', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                     Commit Import Now
                   </button>
                )}
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className={styles.dataTable} style={{ marginTop: '2rem' }}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>Member Details</div>
              <div className={styles.tableHeaderCell}>ID / Phone</div>
              <div className={styles.tableHeaderCell}>Profession</div>
              <div className={styles.tableHeaderCell}>Join Date</div>
              <div className={styles.tableHeaderCell}>Status</div>
              <div className={styles.tableHeaderCell}>Actions</div>
            </div>
            {tableMembers.length > 0 ? (
              tableMembers.map((member, index) => (
                <div key={member._id} className={styles.tableRow}>
                  <div className={styles.memberCell}>
                    <div
                      className={styles.memberAvatar}
                      style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                    >
                      {(member.name || '?').split(' ').map(n => n?.[0]).join('')}
                    </div>
                    <div>
                      <div className={styles.memberCellName}>{member.name}</div>
                      <div className={styles.memberCellEmail}>{member.email}</div>
                    </div>
                  </div>
                  <div className={styles.cellText}>{member.contact_no || member._id.slice(-6)}</div>
                  <div>
                    <span className={styles.professionBadge}>{member.occupation || 'N/A'}</span>
                  </div>
                  <div className={styles.cellText}>{member.createdAt ? member.createdAt.slice(0, 10) : 'Recent'}</div>
                  <div>
                    <span className={`${styles.statusBadge} ${member.active ? styles.statusVerified : styles.statusPending}`}>
                      <span className={styles.statusDot} />
                      {member.active ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <button className={styles.actionsBtn} aria-label="More actions">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                icon={Users}
                title="No accounts found"
                description="Your search criteria did not match any members in the repository."
                action={
                  <button className={styles.actionBtnPrimary} onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                }
              />
            )}
          </div>

          <MemberFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleAddMember}
          />
        </div>

        <Footer />
      </div>
    </div>
  );
}
