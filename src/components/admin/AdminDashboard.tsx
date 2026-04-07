'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Calendar, Wallet, Settings, HelpCircle, LogOut, 
  Search, FileText, Download, UserPlus, TrendingUp, ClipboardList, 
  ShieldCheck, Pencil, MoreVertical, User, ChevronDown, Plus, Trash2, X, MapPin, Clock
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

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const defaultEvents: EventItem[] = [
  {
    id: '1',
    title: 'Heritage Gala & Cultural Night',
    date: '2024-04-15',
    time: '6:00 PM',
    location: 'Grand Ballroom, Samaj Center, Dadar',
    description: 'An evening of culture, tradition, and connecting with the community.',
  },
  {
    id: '2',
    title: 'Annual General Meeting 2024',
    date: '2024-05-20',
    time: '10:00 AM',
    location: 'Convention Hall, Andheri East, Mumbai',
    description: 'Annual meeting to discuss community progress, finances, and upcoming initiatives.',
  },
];

export default function AdminDashboard() {
  const [members, setMembers] = useState<MemberAdmin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [events, setEvents] = useState<EventItem[]>(defaultEvents);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [activeTab, setActiveTab] = useState<'members' | 'events'>('members');
  
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { role, logout, isLoading } = useAuth();

  // Protect Admin Route
  useEffect(() => {
    if (!isLoading && role !== 'admin' && role !== 'committee') {
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
      const data = await ApiClient.get<MemberAdmin[]>('/members', { limit: 100, name: debouncedSearch });
      setMembers(data);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch directory', 'error');
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    if (role === 'admin' || role === 'committee') loadMembers();
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

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: '', date: '', time: '', location: '', description: '' });
    setIsEventModalOpen(true);
  };

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({ title: event.title, date: event.date, time: event.time, location: event.location, description: event.description });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date) {
      toast('Please fill in at least the event title and date.', 'error');
      return;
    }
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventForm } : e));
      toast('Event updated successfully.', 'success');
    } else {
      const newEvent: EventItem = { id: Date.now().toString(), ...eventForm };
      setEvents(prev => [...prev, newEvent]);
      toast('Event created successfully.', 'success');
    }
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast('Event deleted.', 'success');
  };

  if (isLoading || (role !== 'admin' && role !== 'committee')) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Workspace...</div>;
  }

  const tableMembers = members;

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>KVO Nagpur</div>
          <div className={styles.sidebarLogoSub}>{role === 'admin' ? 'Admin Panel' : 'Committee Panel'}</div>
        </div>

        <div className={styles.sidebarProfile}>
          <div className={styles.sidebarAvatar}>
            <User size={20} color="var(--color-primary)" />
          </div>
          <div>
            <div className={styles.sidebarProfileName}>{role === 'admin' ? 'Administrator' : 'Committee Member'}</div>
            <div className={styles.sidebarProfileRole}>Samaj Committee</div>
          </div>
        </div>

          <nav className={styles.sidebarNav}>
          <button 
            className={`${styles.sidebarItem} ${activeTab === 'members' ? styles.sidebarItemActive : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <LayoutDashboard size={18} className={styles.sidebarItemIcon} />
            Dashboard
          </button>
          <button 
            className={`${styles.sidebarItem} ${activeTab === 'events' ? styles.sidebarItemActive : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={18} className={styles.sidebarItemIcon} />
            Manage Events
          </button>
          <a href="/members" className={styles.sidebarItem}>
            <Users size={18} className={styles.sidebarItemIcon} />
            Member Requests
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
            <div className={styles.adminBadge}>{role === 'admin' ? 'Admin Session' : 'Committee Session'}</div>
            <button className={styles.logoutBtnSmall} onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {activeTab === 'members' && (
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
        )}

        {/* Dashboard Content — Members */}
        {activeTab === 'members' && (
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
                  KVO Nagpur members. Professional records and
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
              <div className={styles.tableHeaderCell}>Mobile Number</div>
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
                  <div className={styles.cellText}>{member.contact_no || 'not updated'}</div>
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
        )}

        {/* ========== EVENTS MANAGEMENT TAB ========== */}
        {activeTab === 'events' && (
          <div className={styles.dashboardContent}>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderTop}>
                <div>
                  <p className={styles.pageLabel}>
                    <Calendar size={14} className={styles.pageLabelIcon} />
                    Events Management
                  </p>
                  <h1 className={styles.pageTitle}>Community Events</h1>
                  <p className={styles.pageDescription}>
                    Create, edit, and manage community events. Only committee members can access this section.
                  </p>
                </div>
                <div className={styles.pageActions}>
                  <button className={styles.actionBtnPrimary} onClick={openCreateEvent} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
                    <Plus size={16} /> Create New Event
                  </button>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className={styles.dataTable} style={{ marginTop: '1rem' }}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr' }}>
                <div className={styles.tableHeaderCell}>Event Details</div>
                <div className={styles.tableHeaderCell}>Date</div>
                <div className={styles.tableHeaderCell}>Time</div>
                <div className={styles.tableHeaderCell}>Location</div>
                <div className={styles.tableHeaderCell}>Actions</div>
              </div>
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr' }}>
                    <div>
                      <div className={styles.memberCellName}>{event.title}</div>
                      <div className={styles.memberCellEmail} style={{ marginTop: '2px' }}>{event.description.slice(0, 60)}...</div>
                    </div>
                    <div className={styles.cellText}>
                      {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className={styles.cellText}>{event.time}</div>
                    <div className={styles.cellText} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--color-text-muted)" /> {event.location.split(',')[0]}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className={styles.actionsBtn}
                        aria-label="Edit event"
                        onClick={() => openEditEvent(event)}
                        style={{ padding: '6px', borderRadius: '4px' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className={styles.actionsBtn}
                        aria-label="Delete event"
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{ padding: '6px', borderRadius: '4px', color: '#dc2626' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No events yet"
                  description="Create your first community event to get started."
                  action={
                    <button className={styles.actionBtnPrimary} onClick={openCreateEvent} style={{ border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                      Create Event
                    </button>
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* ========== EVENT FORM MODAL ========== */}
        {isEventModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '520px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative',
              animation: 'fadeUp 0.3s ease',
            }}>
              <button
                onClick={() => { setIsEventModalOpen(false); setEditingEvent(null); }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Event Title *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Heritage Gala Night"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Date *</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm(f => ({ ...f, date: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Time</label>
                    <input
                      type="text"
                      value={eventForm.time}
                      onChange={(e) => setEventForm(f => ({ ...f, time: e.target.value }))}
                      placeholder="6:00 PM"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Grand Ballroom, Samaj Center"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the event..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => { setIsEventModalOpen(false); setEditingEvent(null); }}
                    style={{ padding: '10px 24px', border: '1.5px solid var(--color-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', transition: 'all 0.2s' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    style={{ padding: '10px 24px', border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(139,26,26,0.25)' }}
                  >
                    {editingEvent ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
