import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  type?: 'text' | 'avatar' | 'title' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ type = 'text', width, height, className = '', style }: SkeletonProps) {
  const classes = `${styles.skeleton} ${styles[type]} ${className}`.trim();

  const dynamicStyle: React.CSSProperties = { ...style };
  if (width) dynamicStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (height) dynamicStyle.height = typeof height === 'number' ? `${height}px` : height;

  return <div className={classes} style={dynamicStyle} />;
}
