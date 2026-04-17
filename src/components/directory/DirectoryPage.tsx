'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, LayoutGrid, List, ShieldCheck, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './DirectoryPage.module.css';
import { OverlayBadge } from '@/components/ui/Badge/Badge';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { DirectorySkeleton } from '@/components/ui/Skeleton/Skeleton';
import { useGsapHeroEntrance } from '@/hooks/useGsapAnimations';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Member } from '@/types';

const AVATAR_COLORS = ['#8B1A1A', '#C8956C', '#2D5F8B', '#4A7C59', '#7B5EA7', '#D4763C', '#3B8686', '#9B5DE5', '#E07A5F'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const highlightMatch = (name: string, query: string) => {
  if (!query.trim()) return name;
  const q = query.trim().toLowerCase();
  
  // Split query into parts to handle multi-word highlighting
  const queryParts = q.split(/\s+/).filter(part => part.length > 0);
  
  // Create a regex to match any of the query parts (substring matching)
  try {
    const pattern = queryParts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'i');
    const parts = name.split(regex);

    return parts.map((part, i) => {
      const isMatch = regex.test(part);
      if (isMatch) {
        return (
          <span key={i} style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  } catch (e) {
    return name;
  }
};

export default function DirectoryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { toast } = useToast();
  const itemsPerPage = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setActiveIndex(-1); // Reset highlight when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = debouncedSearch.trim();
      const response = await ApiClient.get<Member[]>('/members', {
        page: currentPage,
        limit: itemsPerPage,
        name: q,
      });
      setMembers(response);
      setHasMore(response.length === itemsPerPage);
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      // Only show error toast if it's NOT an unauthorized error during background load
      if (msg !== 'Unauthorized') {
        toast(msg || 'Failed to load directory', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, toast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!members.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < members.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        router.push(`/directory/${members[activeIndex].id}`);
      }
    }
  };

  const headerRef = useGsapHeroEntrance<HTMLDivElement>('.gsap-dir-header');
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Stagger member cards on data change
  useGSAP(() => {
    if (!gridRef.current || isLoading || members.length === 0) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = gridRef.current.querySelectorAll('.gsap-member-card');
    gsap.fromTo(cards,
      { y: 25, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      }
    );
  }, { scope: gridRef, dependencies: [members, isLoading, viewMode] });

  return (
    <div className={styles.directoryContent} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div ref={headerRef} className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={`${styles.headerLabel} gsap-dir-header`}>Community Network</p>
          <h1 className={`${styles.headerTitle} gsap-dir-header`}>Member Directory</h1>
          <p className={`${styles.headerDescription} gsap-dir-header`}>
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
          <div 
            ref={gridRef}
            className={viewMode === 'grid' ? styles.memberGrid : styles.memberList}
          >
            {members.map((member, index) => (
              <div 
                key={`${member.id}-${index}`} 
                className={`${styles.memberCard} ${index === activeIndex ? styles.memberCardActive : ''} gsap-member-card`}
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
                  <h3 className={styles.memberCardName}>
                    {highlightMatch(member.name, debouncedSearch)}
                  </h3>
                  <p className={styles.memberCardProfession}>{member.occupation || 'N/A'}</p>
                  <p className={styles.memberCardLocation}>
                    <MapPin size={14} className={styles.locationIcon} />
                    {member.current_place || 'Unknown'}
                  </p>
                  <Link href={`/directory/${member.id}`} className={styles.viewProfileBtn}>
                    View Basic Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

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
              onClick={() => setSearchQuery('')}
            >
              Clear Filters
            </button>
          }
        />
      )}
    </div>
  );
}
