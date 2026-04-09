'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, LayoutGrid, List, ShieldCheck, MapPin, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import styles from './DirectoryPage.module.css';
import { OverlayBadge } from '@/components/ui/Badge/Badge';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { DirectorySkeleton } from '@/components/ui/Skeleton/Skeleton';
import { motion } from 'framer-motion';
import { Member } from '@/types';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}


export default function DirectoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const itemsPerPage = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ApiClient.get<Member[]>('/members', {
        page: currentPage,
        limit: itemsPerPage,
        name: debouncedSearch,
        city: locationFilter,
        occupation: professionFilter,
      });
      setMembers(response);
      setHasMore(response.length === itemsPerPage);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to load directory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, locationFilter, professionFilter, toast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Treat back button as logout — push one state to absorb the first press,
  // then on popstate, sign the user out and replace history (kills forward button)
  useEffect(() => {
    // 1. Prevent BFCache — pages with beforeunload listeners are excluded from BFCache.
    //    This ensures that pressing forward to this page makes a fresh HTTP request
    //    (which the middleware will catch and redirect to /login if unauthenticated).
    const preventBFCache = () => {};
    window.addEventListener('beforeunload', preventBFCache);

    // 2. Handle BFCache restoration as a fallback (shouldn't normally happen)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from cache — check auth immediately
        const hasAuth = document.cookie.split(';').some(c =>
          c.trim().startsWith('sb-uevmyvwbmxqreyukbvkq-auth-token=')
        );
        if (!hasAuth) window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // 3. Back button = logout: push one absorber entry, then on popstate clear session
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value === 'All Categories' ? '' : e.target.value);
    setCurrentPage(1);
  };

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
          <button 
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} /> Grid
          </button>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> List
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name or keyword..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Placeholder dynamic filters - Backend mapping later */}
        <select 
          className={styles.filterSelect}
          value={professionFilter}
          onChange={handleFilterChange(setProfessionFilter)}
        >
          <option value="">All Professions</option>
          <option value="Business">Business</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Doctor">Doctor</option>
        </select>
        <select 
          className={styles.filterSelect}
          value={locationFilter}
          onChange={handleFilterChange(setLocationFilter)}
        >
          <option value="">All Locations</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Bhuj">Bhuj</option>
          <option value="London">London</option>
          <option value="Dubai">Dubai</option>
        </select>
        <button className={styles.filterBtn} aria-label="Advanced filters">
          <Settings size={18} />
        </button>
      </div>

      {/* Privacy Notice */}
      <div className={styles.privacyNotice}>
        <ShieldCheck size={18} className={styles.privacyIcon} />
        Privacy-First: Sensitive contact information is hidden for security. Use &apos;Request Contact&apos; inside profiles for inquiries.
      </div>

      {/* Loading State Output */}
      {isLoading ? (
        <DirectorySkeleton />
      ) : members.length > 0 ? (
        <>
          <motion.div 
            className={viewMode === 'grid' ? styles.memberGrid : styles.memberList}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {members.map((member) => (
              <motion.div 
                key={member.id} 
                className={styles.memberCard}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              >
                <div className={styles.memberCardImage}>
                  <div 
                    className={styles.memberCardInitials} 
                    style={{ backgroundColor: getAvatarColor(member.name) }}
                  >
                    {(member.name || '?').split(' ').map(n => n?.[0]).join('')}
                  </div>
                  {member.contact_visibility === 'public' && (
                    <OverlayBadge type="verified">Public</OverlayBadge>
                  )}
                </div>
                <div className={styles.memberCardBody}>
                  <h3 className={styles.memberCardName}>{member.name}</h3>
                  <p className={styles.memberCardProfession}>{member.occupation || 'N/A'}</p>
                  <p className={styles.memberCardLocation}>
                    <MapPin size={14} className={styles.locationIcon} />
                    {member.current_place || 'Unknown'}
                  </p>
                  <Link href={`/directory/${member.id}`} className={styles.viewProfileBtn}>
                    View Basic Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Simple Pagination */}
          <div className={styles.paginationWrapper} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
             <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className={styles.viewProfileBtn}
              >
               Previous
             </button>
             <button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={!hasMore}
                className={styles.viewProfileBtn}
              >
               Next Page
             </button>
          </div>
        </>
      ) : (
        <EmptyState 
          icon={Users}
          title="No members found"
          description="We couldn't find any members matching your current filters and search criteria. Try adjusting them."
          action={
            <button 
              className="ctaBtnOutlinedHero" 
              style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              onClick={() => { setSearchQuery(''); setProfessionFilter(''); setLocationFilter(''); }}
            >
              Clear Filters
            </button>
          }
        />
      )}
    </div>
  );
}
