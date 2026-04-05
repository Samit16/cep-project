'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height, 
  style 
}) => {
  const skeletonStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style
  };

  return (
    <div 
      className={`${styles.skeleton} ${styles[variant]} ${className}`} 
      style={skeletonStyle}
    />
  );
};

export const DirectorySkeleton = () => (
  <div className={styles.directorySkeletonGrid}>
    {[...Array(8)].map((_, i) => (
      <div key={i} className={styles.skeletonCard}>
        <Skeleton variant="rectangular" height={160} className={styles.cardImage} />
        <div className={styles.cardBody}>
          <Skeleton variant="text" width="70%" height={24} className={styles.cardTitle} />
          <Skeleton variant="text" width="40%" height={16} className={styles.cardSub} />
          <Skeleton variant="text" width="60%" height={16} className={styles.cardText} />
          <Skeleton variant="rectangular" width="100%" height={36} className={styles.cardBtn} />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className={styles.profileSkeleton}>
    <div className={styles.heroSkeleton}>
      <Skeleton variant="circular" width={120} height={120} className={styles.avatar} />
      <div className={styles.heroContent}>
        <Skeleton variant="text" width="20%" height={20} />
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="text" width="40%" height={48} />
        <Skeleton variant="text" width="80%" height={20} />
      </div>
    </div>
    <div className={styles.gridSkeleton}>
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="rectangular" height={200} />
    </div>
  </div>
);
