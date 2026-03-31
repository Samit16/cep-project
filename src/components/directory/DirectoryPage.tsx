'use client';

import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, List, ShieldCheck, MapPin, Settings } from 'lucide-react';
import styles from './DirectoryPage.module.css';
import { OverlayBadge } from '@/components/ui/Badge/Badge';
import Pagination from '@/components/ui/Pagination/Pagination';
import { mockMembers } from '@/data/mock';

export default function DirectoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState('All Professions');
  const [locationFilter, setLocationFilter] = useState('All Locations');

  const filteredMembers = useMemo(() => {
    return mockMembers.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.profession.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProfession = professionFilter === 'All Professions' || member.profession === professionFilter;
      const matchesLocation = locationFilter === 'All Locations' || 
                             `${member.city}, ${member.state}` === locationFilter ||
                             member.city === locationFilter;
      
      return matchesSearch && matchesProfession && matchesLocation;
    });
  }, [searchQuery, professionFilter, locationFilter]);

  const professions = ['All Professions', ...Array.from(new Set(mockMembers.map(m => m.profession)))];
  const locations = ['All Locations', ...Array.from(new Set(mockMembers.map(m => m.city + (m.state ? `, ${m.state}` : ''))))];

  const members = filteredMembers.slice(0, 8); // Show up to 8 for the grid demo

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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className={styles.filterSelect}
          value={professionFilter}
          onChange={(e) => setProfessionFilter(e.target.value)}
        >
          {professions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select 
          className={styles.filterSelect}
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
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

      {/* Member Grid */}
      <div className={styles.memberGrid}>
        {members.map((member) => (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.memberCardImage}>
              {member.photoUrl ? (
                <img src={`/images/members/member${member.id}.jpg`} alt={member.name} />
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
                <MapPin size={14} className={styles.locationIcon} />
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
