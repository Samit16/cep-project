'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Calendar, LogOut, 
  Search, Download, UserPlus, TrendingUp, ClipboardList, 
  ShieldCheck, Pencil, MoreVertical, User, Plus, Trash2, X, MapPin, Activity
} from 'lucide-react';
import styles from './AdminDashboard.module.css';
import Footer from '@/components/layout/Footer/Footer';
import MemberFormModal from './MemberFormModal';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const avatarColors = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

interface MemberAdmin {
  id: string;
  name: string;
  contact_no?: string;
  email: string;
  occupation?: string;
  current_place?: string;
  active: boolean;
  createdAt?: string;
  updated_at?: string;
  created_at?: string;
  contact_numbers?: string[];
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<EventItem[]>(defaultEvents);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [activeTab, setActiveTab] = useState<'members' | 'events'>('members');
  
  const fileInputRef = useRef<HTMLInputElement>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const { toast } = useToast();
  const { role, logout, isLoading } = useAuth();

  // Protect Admin Route
  useEffect(() => {
    if (!isLoading && role !== 'admin' && role !== 'committee') {
      router.push('/login');
    }
  }, [isLoading, role, router]);

  // Treat back button as logout, prevent BFCache on this protected page
  useEffect(() => {
    // 1. Prevent BFCache — fresh HTTP request on forward navigation
    const preventBFCache = () => {};
    window.addEventListener('beforeunload', preventBFCache);

    // 2. Handle BFCache restoration as fallback
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const hasAuth = document.cookie.split(';').some(c =>
          c.trim().startsWith('sb-uevmyvwbmxqreyukbvkq-auth-token=')
        );
        if (!hasAuth) window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // 3. Back button = logout
    window.history.pushState({ isApp: true }, '', window.location.href);
    const handleBackButton = () => {
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('kjo_token');
      document.cookie = 'sb-uevmyvwbmxqreyukbvkq-auth-token=; path=/; max-age=0;';
      document.cookie = 'kjo_token=; Max-Age=0; path=/;';
      window.location.replace('/');
    };
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('beforeunload', preventBFCache);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const loadMembers = useCallback(async () => {
    if (role !== 'admin' && role !== 'committee') return;
    try {
      const data = await ApiClient.get<MemberAdmin[]>('/admin/members', { limit: 100, name: debouncedSearch });
      setMembers(data);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to fetch directory', 'error');
    }
  }, [role, debouncedSearch, toast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);


  const handleLogout = () => {
    logout();
  };

  const handleExportCSV = () => {
    // Basic mock export
    toast('Exporting Directory Data... Feature coming soon matching filters.', 'success');
  };



  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddMember = (_newMember: { name: string; email: string; profession: string; city: string; phone: string; role: string }) => {
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

  // Client-side filter as a fallback in case backend search doesn't respond to query changes
  const tableMembers = useMemo(() => {
    if (!debouncedSearch) return members;
    const q = debouncedSearch.toLowerCase();
    return members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  }, [members, debouncedSearch]);

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
              <Link href="/dashboard" className={`${styles.topBarLink} ${styles.topBarLinkActive}`}>Overview</Link>
              <Link href="/directory" className={styles.topBarLink}>Directory</Link>
              <Link href="/about" className={styles.topBarLink}>About</Link>
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
              <span className={`${styles.statTrend} ${styles.statTrendNeutral}`}>
                {members.length > 0 ? Math.round((members.filter(m => m.active).length / members.length) * 100) : 0}%
              </span>
            </div>
            <div className={styles.statValue}>
              {members.filter(m => m.active).length}
            </div>
            <div className={styles.statLabel}>Verified Community Members</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff' }}>
                <MapPin size={20} color="#2563eb" />
              </div>
            </div>
            <div className={styles.statValue}>
              {new Set(members.map(m => m.current_place).filter(Boolean)).size}
            </div>
            <div className={styles.statLabel}>Global Cities Represented</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#faf5ff' }}>
                <Activity size={20} color="#7c3aed" />
              </div>
            </div>
            <div className={styles.statValue}>
              {members.length > 0
                ? Math.round((members.filter(m => m.updated_at && m.created_at && m.updated_at !== m.created_at).length / members.length) * 100)
                : 0}%
            </div>
            <div className={styles.statLabel}>Profile Completion Rate</div>
          </div>
        </div>
        )}

        {/* Member Insights */}
        {activeTab === 'members' && members.length > 0 && (
        <div className={styles.insightsSection}>
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>Activity Overview</h3>
            <div className={styles.insightBody}>
              <div className={styles.insightRow}>
                <span className={styles.insightLabel}>Active members</span>
                <span className={styles.insightValue}>{members.filter(m => m.active).length}</span>
              </div>
              <div className={styles.insightRow}>
                <span className={styles.insightLabel}>Profiles updated</span>
                <span className={styles.insightValue}>
                  {members.filter(m => m.updated_at && m.created_at && m.updated_at !== m.created_at).length}
                </span>
              </div>
              <div className={styles.insightRow}>
                <span className={styles.insightLabel}>With contact info</span>
                <span className={styles.insightValue}>
                  {members.filter(m => m.contact_numbers && m.contact_numbers.length > 0).length}
                </span>
              </div>
              <div className={styles.insightRow}>
                <span className={styles.insightLabel}>Pending updates</span>
                <span className={styles.insightValue}>
                  {members.filter(m => !m.updated_at || m.updated_at === m.created_at).length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>Top Cities</h3>
            <div className={styles.insightBody}>
              {(() => {
                const cityCount: Record<string, number> = {};
                members.forEach(m => {
                  const city = m.current_place || 'Unknown';
                  cityCount[city] = (cityCount[city] || 0) + 1;
                });
                return Object.entries(cityCount)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([city, count]) => (
                    <div key={city} className={styles.insightRow}>
                      <span className={styles.insightLabel}>
                        <MapPin size={12} style={{ opacity: 0.5 }} /> {city}
                      </span>
                      <div className={styles.insightBarWrapper}>
                        <div
                          className={styles.insightBar}
                          style={{ width: `${Math.min(100, (count / members.length) * 100 * 3)}%` }}
                        />
                        <span className={styles.insightValue}>{count}</span>
                      </div>
                    </div>
                  ));
              })()}
            </div>
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
                <button className={styles.actionBtn} onClick={() => toast('Direct member creation coming soon.', 'info')}>
                  <UserPlus size={16} /> Add Member
                </button>
                <button className={styles.actionBtn} onClick={handleExportCSV}>
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
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
                <div key={member.id} className={styles.tableRow}>
                  <div className={styles.memberCell}>
                    <div
                      className={styles.memberAvatar}
                      style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                    >
                      {(member.name || '?').split(' ').filter(Boolean).map(n => n?.[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.memberCellName}>{member.name}</div>
                      <div className={styles.memberCellEmail}>{member.email}</div>
                    </div>
                  </div>
                  <div className={styles.cellText}>
                    {member.contact_numbers?.length 
                      ? member.contact_numbers[0] 
                      : (member.contact_no || 'not updated')}
                  </div>
                  <div>
                    <span className={styles.professionBadge}>{member.occupation || 'N/A'}</span>
                  </div>
                  <div className={styles.cellText}>{member.createdAt ? member.createdAt.slice(0, 10) : 'Recent'}</div>
                  <div>
                    {(() => {
                      const isUpdated = member.updated_at && member.created_at && member.updated_at !== member.created_at;
                      const hasContacts = member.contact_numbers && member.contact_numbers.length > 0;
                      const isProfileUpdated = isUpdated || hasContacts;
                      return (
                        <span className={`${styles.statusBadge} ${isProfileUpdated ? styles.statusVerified : styles.statusPending}`}>
                          <span className={styles.statusDot} />
                          {isProfileUpdated ? 'UPDATED' : 'NOT UPDATED'}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      className={styles.actionsBtn}
                      aria-label="More actions"
                      aria-expanded={openMenuId === member.id}
                      aria-haspopup="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(prev => prev === member.id ? null : member.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === member.id && (
                      <div ref={menuRef} className={styles.dropdownMenu}>
                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            setOpenMenuId(null);
                            toast('Edit member feature coming soon.', 'info');
                          }}
                        >
                          <Pencil size={14} /> Edit Member
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                          onClick={() => {
                            setOpenMenuId(null);
                            toast('Delete member feature coming soon.', 'info');
                          }}
                        >
                          <Trash2 size={14} /> Delete Member
                        </button>
                      </div>
                    )}
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
