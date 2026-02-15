'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-bg-tertiary';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(baseStyles, variantStyles.text, className)}
            style={{ 
              ...style, 
              width: i === lines - 1 ? '60%' : width 
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn(baseStyles, variantStyles[variant], className)} 
      style={style}
    />
  );
}

// Pre-built skeleton layouts

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface border border-border rounded-xl p-5 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={100} className="w-full" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3 bg-surface border border-border rounded-lg', className)}>
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="30%" />
      </div>
      <Skeleton variant="rectangular" width={60} height={24} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton variant="text" width={i === 0 ? '70%' : '50%'} />
        </td>
      ))}
    </tr>
  );
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="30%" />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="30%" />
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" width={120} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="text" width="30%" />
          <div className="flex gap-2 mt-2">
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={80} height={32} />
        ))}
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="rectangular" height={40} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
