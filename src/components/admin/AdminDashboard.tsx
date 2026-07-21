'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Calendar, 
  Search, Download, UserPlus, TrendingUp, ClipboardList, 
  ShieldCheck, Pencil, MoreVertical, Plus, Trash2, X, MapPin, Activity, CheckCircle2, Home
} from 'lucide-react';
import styles from './AdminDashboard.module.css';
import Footer from '@/components/layout/Footer/Footer';
import MemberFormModal from './MemberFormModal';
import Navbar from '@/components/layout/Navbar/Navbar';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MemberGrowthChart, OverviewRingChart, EventParticipationChart } from './AdminCharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const avatarColors = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7'];

interface MemberAdmin {
  id: string;
  name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  contact_no?: string;
  email: string;
  email_verified?: boolean;
  occupation?: string;
  current_place?: string;
  active: boolean;
  profile_complete?: boolean;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  contact_numbers?: string[];
  role?: string;
  family_id?: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const FloatingLabelInput = ({ label, type = 'text', value, onChange, placeholder, isValid }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
  const [focused, setFocused] = useState(false);
  const hasInteracted = value.length > 0;
  
  let borderColor = 'var(--color-border)';
  if (focused) borderColor = 'var(--color-primary)';
  else if (hasInteracted && isValid) borderColor = '#16a34a';
  else if (hasInteracted && !isValid) borderColor = '#dc2626';

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: focused || value ? '-10px' : '14px',
        left: '14px',
        background: 'var(--color-bg-card)',
        padding: '0 4px',
        fontSize: focused || value ? '0.75rem' : '0.9375rem',
        color: focused ? 'var(--color-primary)' : 'var(--color-text-muted)',
        transition: 'all 0.2s',
        pointerEvents: 'none',
        zIndex: 2,
        fontWeight: focused || value ? 600 : 400
      }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={focused ? placeholder : ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '1.5px solid',
          borderColor,
          borderRadius: '8px',
          fontSize: '0.9375rem',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(139,26,26,0.1)' : 'none',
          background: hasInteracted && isValid && !focused ? 'var(--color-status-verified-bg)' : 'var(--color-bg-input)',
          transition: 'all 0.2s',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

export default function AdminDashboard() {
  const [members, setMembers] = useState<MemberAdmin[]>([]);
  const [totalMemberCount, setTotalMemberCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberAdmin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [activeTab, setActiveTab] = useState<'members' | 'events'>('members');
  
  const router = useRouter();
  const { toast } = useToast();
  const { role, logout, isLoading } = useAuth();
  const isLoggingOut = useRef(false);

  // Protect Admin Route — skip during active logout
  useEffect(() => {
    if (isLoggingOut.current) return;
    if (!isLoading && role !== 'admin' && role !== 'committee') {
      router.push('/login');
    }
  }, [isLoading, role, router]);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lastFetchRef = useRef<number>(0);

  // Unified fast data loader using /admin/dashboard
  const loadDashboardData = useCallback(async (force = false) => {
    // Throttle window focus re-fetches to max once per 30s unless forced
    const now = Date.now();
    if (!force && lastFetchRef.current > 0 && now - lastFetchRef.current < 30000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      const data = await ApiClient.get<{
        totalMemberCount: number;
        members: MemberAdmin[];
        events: EventItem[];
      }>('/admin/dashboard', { search: debouncedSearch });

      setTotalMemberCount(data.totalMemberCount);
      setMembers(data.members || []);
      setEvents(data.events || []);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to load dashboard data', 'error');
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    loadDashboardData(true);

    const handleFocus = () => loadDashboardData(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadDashboardData]);

  // If the user arrived via the Google OAuth flow, intercept back navigation
  // so the account picker isn't exposed in history and user can confirm logout.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const authMethod = localStorage.getItem('kjo_auth_method');
    if (authMethod !== 'google') return;

    try { window.history.pushState(null, '', window.location.href); } catch {}

    const handlePop = async () => {
      const confirmed = window.confirm('Do you want to log out and leave this page?');
      if (confirmed) {
        await logout();
        window.location.replace('/home');
      } else {
        // push state back so user stays on the page
        try { window.history.pushState(null, '', window.location.href); } catch {}
      }
    };

    window.addEventListener('popstate', handlePop);
    // clear the flag (only need to do this once per login)
    localStorage.removeItem('kjo_auth_method');

    return () => window.removeEventListener('popstate', handlePop);
  }, [logout]);



  const handleExportCSV = () => {
    // Basic mock export
    toast('Exporting Directory Data... Feature coming soon matching filters.', 'success');
  };


  const handleAddMember = async (newMember: { first_name: string; middle_name: string; last_name: string; email: string; profession: string; city: string; phone: string; role: string }) => {
    try {
      if (editingMember) {
        await ApiClient.put(`/admin/members/${editingMember.id}`, {
          first_name: newMember.first_name,
          middle_name: newMember.middle_name,
          last_name: newMember.last_name,
          email: newMember.email,
          occupation: newMember.profession,
          current_place: newMember.city,
          contact_numbers: newMember.phone ? [newMember.phone] : [],
          role: newMember.role,
        });
        toast('Member updated successfully', 'success');
      } else {
        await ApiClient.post('/admin/members', {
          first_name: newMember.first_name,
          middle_name: newMember.middle_name,
          last_name: newMember.last_name,
          email: newMember.email,
          occupation: newMember.profession,
          current_place: newMember.city,
          contact_numbers: newMember.phone ? [newMember.phone] : [],
          active: true,
          role: newMember.role,
        });
        toast('Member created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      // Re-fetch members and count
      await loadDashboardData(true);
    } catch (err: unknown) {
      toast((err as Error).message || `Failed to ${editingMember ? 'update' : 'create'} member`, 'error');
    }
  };

  const handleToggleRole = async (memberId: string, currentRole?: string) => {
    try {
      const newRole = currentRole === 'committee' ? 'member' : 'committee';
      await ApiClient.put(`/admin/members/${memberId}`, { role: newRole });
      toast(`Role updated to ${newRole}`, 'success');
      setOpenMenuId(null);
      
      // Update local state for immediate feedback
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      await loadDashboardData(true);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to update role', 'error');
    }
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: '', date: '', time: '', location: '', description: '' });
    setIsEventModalOpen(true);
  };

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({ title: event.title, date: event.date, time: event.time || '', location: event.location || '', description: event.description || '' });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.date) {
      toast('Please fill in at least the event title and date.', 'error');
      return;
    }
    try {
      if (editingEvent) {
        await ApiClient.put<EventItem>(`/events/${editingEvent.id}`, {
          title: eventForm.title,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
          description: eventForm.description,
        });
        toast('Event updated successfully.', 'success');
      } else {
        await ApiClient.post<EventItem>('/events', {
          title: eventForm.title,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
          description: eventForm.description,
          is_public: true,
        });
        toast('Event created successfully.', 'success');
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
      await loadDashboardData(true);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to save event.', 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await ApiClient.delete(`/events/${id}`);
      toast('Event deleted.', 'success');
      await loadDashboardData(true); 
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to delete event.', 'error');
    }
  };

  // Client-side filter (moved before early return to satisfy rules-of-hooks)
  const tableMembers = useMemo(() => {
    if (!debouncedSearch) return members;
    const q = debouncedSearch.toLowerCase();
    return members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  }, [members, debouncedSearch]);

  const formedFamiliesCount = useMemo(() => {
    const counts = members.reduce((acc, m) => {
      if (m.family_id) {
        acc[m.family_id] = (acc[m.family_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.values(counts).filter(count => count > 1).length;
  }, [members]);

  const checkIsProfileUpdated = useCallback((m: MemberAdmin) => {
    if (m.profile_complete) return true;
    if (m.email_verified) return true;
    if (m.updated_at && m.created_at) {
      const updatedTime = new Date(m.updated_at).getTime();
      const createdTime = new Date(m.created_at).getTime();
      if (updatedTime - createdTime > 1000) {
        return true;
      }
    }
    return false;
  }, []);

  const completedCount = useMemo(() => {
    return members.filter(checkIsProfileUpdated).length;
  }, [members, checkIsProfileUpdated]);

  const pendingCount = useMemo(() => {
    return members.length - completedCount;
  }, [members, completedCount]);

  const profileCompletionRate = useMemo(() => {
    return members.length > 0 ? Math.round((completedCount / members.length) * 100) : 0;
  }, [members, completedCount]);

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Progressive stat card entrance
    gsap.fromTo(`.${styles.statCard}`,
      { y: 30, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'expo.out',
        clearProps: 'transform,opacity'
      }
    );

    // Insight cards cascade after stats
    gsap.fromTo(`.${styles.insightCard}`,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.85,
        delay: 0.35,
        stagger: 0.15,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }
    );
  }, { dependencies: [activeTab] });

  if (isLoading || (role !== 'admin' && role !== 'committee')) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Workspace...</div>;
  }

  return (
    <div className={styles.adminLayout}>
      <Navbar variant="admin" activeLink="dashboard" />

      <div className={styles.mainContent}>
        {/* Tab Selector */}
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'members' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} className={styles.tabIcon} />
            <span>Members Directory</span>
            <span className={styles.tabCount}>{totalMemberCount || members.length}</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'events' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={16} className={styles.tabIcon} />
            <span>Events Management</span>
            <span className={styles.tabCount}>{events.length}</span>
          </button>
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
            <div className={styles.statValue}>{totalMemberCount || members.length}</div>
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
                <Home size={20} color="#2563eb" />
              </div>
            </div>
            <div className={styles.statValue}>
              {formedFamiliesCount}
            </div>
            <div className={styles.statLabel}>No. of Families</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#faf5ff' }}>
                <Activity size={20} color="#7c3aed" />
              </div>
            </div>
            <div className={styles.statValue}>
              {profileCompletionRate}%
            </div>
            <div className={styles.statLabel}>Profile Completion Rate</div>
          </div>
        </div>
        )}

        {/* Data Visualization */}
        {activeTab === 'members' && (
        <div className={styles.insightGrid}>
          
          <div className={`${styles.insightCard} ${styles.cardFull}`}>
            <h3 className={styles.insightTitle}>Community Growth</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>M-o-M new member registrations</p>
            <MemberGrowthChart members={members} />
          </div>

          <div className={`${styles.insightCard} ${styles.cardHalf}`}>
            <h3 className={styles.insightTitle}>Profile Verification</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Percentage of updated profiles in system</p>
            <OverviewRingChart 
              active={completedCount} 
              pending={pendingCount} 
            />
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
                <button className={styles.actionBtn} onClick={() => { setEditingMember(null); setIsModalOpen(true); }}>
                  <UserPlus size={16} /> Add Member
                </button>
                <button className={styles.actionBtn} onClick={handleExportCSV}>
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
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
                      {member.first_name?.[0] || member.name?.[0] || '?'}
                      {member.last_name?.[0] || ''}
                    </div>
                    <div>
                      <div className={styles.memberCellName}>
                        {member.name}
                        {member.role === 'committee' && <span className={styles.professionBadge} style={{marginLeft: '8px', backgroundColor: 'var(--color-primary-lightest)', color: 'var(--color-primary)'}}>Committee</span>}
                        {member.role === 'admin' && <span className={styles.professionBadge} style={{marginLeft: '8px', backgroundColor: 'var(--color-primary-lightest)', color: 'var(--color-primary-dark)'}}>Admin</span>}
                      </div>
                      <div className={styles.memberCellEmail} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {member.email}
                        {member.email_verified && <CheckCircle2 size={12} color="#16a34a" />}
                      </div>
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    {member.contact_numbers?.length 
                      ? member.contact_numbers[0] 
                      : (member.contact_no || 'Not updated')}
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.professionBadge}>{member.occupation || 'N/A'}</span>
                  </div>
                  <div className={styles.tableCell}>{member.createdAt ? member.createdAt.slice(0, 10) : 'Recent'}</div>
                  <div className={styles.tableCell}>
                    {(() => {
                      const isProfileUpdated = checkIsProfileUpdated(member);
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
                            setEditingMember(member);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil size={14} /> Edit Member
                        </button>
                        {member.role !== 'admin' && (
                          <button
                            className={styles.dropdownItem}
                            onClick={() => handleToggleRole(member.id, member.role)}
                          >
                            <ShieldCheck size={14} /> 
                            {member.role === 'committee' ? 'Make Regular Member' : 'Make Committee Member'}
                          </button>
                        )}
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
          </div>

          <MemberFormModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setEditingMember(null); }} 
            onSave={handleAddMember}
            initialData={editingMember ? {
              first_name: editingMember.first_name || '',
              middle_name: editingMember.middle_name || '',
              last_name: editingMember.last_name || '',
              email: editingMember.email || '',
              profession: editingMember.occupation || '',
              city: editingMember.current_place || '',
              phone: editingMember.contact_numbers?.[0] || editingMember.contact_no || '',
              role: editingMember.role || 'member'
            } : undefined}
          />
        </div>
        )}

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
            <div className={styles.tableWrapper}>
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
                        <div className={styles.memberCellEmail} style={{ marginTop: '2px' }}>{(event.description || '').slice(0, 60)}...</div>
                      </div>
                      <div className={styles.tableCell}>
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className={styles.tableCell}>{event.time}</div>
                      <div className={styles.tableCell} style={{ gap: '6px' }}>
                        <MapPin size={14} color="var(--color-text-muted)" /> {(event.location || '').split(',')[0] || 'Unknown'}
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
                  />
                )}
              </div>
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
              background: 'var(--color-bg-card)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '520px',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                <FloatingLabelInput
                  label="Event Title *"
                  value={eventForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Heritage Gala Night"
                  isValid={eventForm.title.length > 3}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FloatingLabelInput
                    label="Date *"
                    type="date"
                    value={eventForm.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm(f => ({ ...f, date: e.target.value }))}
                    isValid={!!eventForm.date}
                  />
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Time</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={eventForm.time.replace(/ (AM|PM)$/, '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentPeriod = eventForm.time.match(/AM|PM/)?.[0] || 'PM';
                          setEventForm(f => ({ ...f, time: val ? `${val} ${currentPeriod}` : '' }));
                        }}
                        placeholder="6:30"
                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                      />
                      <select
                        value={eventForm.time.match(/AM|PM/)?.[0] || 'PM'}
                        onChange={(e) => {
                          const val = eventForm.time.replace(/ (AM|PM)$/, '') || '12:00';
                          setEventForm(f => ({ ...f, time: `${val} ${e.target.value}` }));
                        }}
                        style={{ padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-input)', fontSize: '0.9375rem', cursor: 'pointer', outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <FloatingLabelInput
                  label="Location"
                  value={eventForm.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Grand Ballroom, Samaj Center"
                  isValid={eventForm.location.length > 2}
                />
                
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the event..."
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.2s', background: 'var(--color-bg-input)' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,26,26,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = eventForm.description.length > 5 ? '#16a34a' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; e.target.style.background = eventForm.description.length > 5 ? '#f0fdf4' : 'var(--color-bg-input)'; }}
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