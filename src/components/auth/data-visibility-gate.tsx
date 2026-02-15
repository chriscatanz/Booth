'use client';

import React from 'react';
import { useDataVisibility } from '@/hooks/use-data-visibility';
import { DataCategory } from '@/types/data-visibility';
import { Skeleton } from '@/components/ui/skeleton';

interface DataVisibilityGateProps {
  category: DataCategory;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Custom skeleton to show while loading. Defaults to a basic rectangular skeleton. */
  loadingSkeleton?: React.ReactNode;
  /** Set to false to show nothing while loading (legacy behavior) */
  showLoadingSkeleton?: boolean;
}

/**
 * Conditionally renders children based on role-based data visibility settings.
 * Wraps content that should only be visible to roles with access to the specified category.
 * 
 * @example
 * <DataVisibilityGate category="budget">
 *   <BudgetSection />
 * </DataVisibilityGate>
 * 
 * @example
 * // With custom loading skeleton
 * <DataVisibilityGate 
 *   category="budget" 
 *   loadingSkeleton={<SkeletonCard />}
 * >
 *   <BudgetSection />
 * </DataVisibilityGate>
 */
export function DataVisibilityGate({ 
  category, 
  children, 
  fallback = null,
  loadingSkeleton,
  showLoadingSkeleton = true,
}: DataVisibilityGateProps) {
  const { canSeeCategory, isLoading } = useDataVisibility();

  // While loading, show skeleton
  if (isLoading) {
    if (!showLoadingSkeleton) return null;
    return <>{loadingSkeleton ?? <Skeleton variant="rectangular" height={60} className="w-full" />}</>;
  }

  // Check if user can see this category
  if (!canSeeCategory(category)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface FieldVisibilityGateProps {
  field: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Custom skeleton to show while loading */
  loadingSkeleton?: React.ReactNode;
  /** Set to false to show nothing while loading (legacy behavior) */
  showLoadingSkeleton?: boolean;
}

/**
 * Conditionally renders children based on whether the user can see a specific field.
 * 
 * @example
 * <FieldVisibilityGate field="cost">
 *   <span>${show.cost}</span>
 * </FieldVisibilityGate>
 */
export function FieldVisibilityGate({ 
  field, 
  children, 
  fallback = null,
  loadingSkeleton,
  showLoadingSkeleton = true,
}: FieldVisibilityGateProps) {
  const { canSeeField, isLoading } = useDataVisibility();

  if (isLoading) {
    if (!showLoadingSkeleton) return null;
    return <>{loadingSkeleton ?? <Skeleton variant="text" width="60%" />}</>;
  }

  if (!canSeeField(field)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface MultiCategoryGateProps {
  categories: DataCategory[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Custom skeleton to show while loading */
  loadingSkeleton?: React.ReactNode;
  /** Set to false to show nothing while loading (legacy behavior) */
  showLoadingSkeleton?: boolean;
}

/**
 * Conditionally renders children based on multiple categories.
 * 
 * @param mode - 'any' (default) shows content if ANY category is visible, 'all' requires ALL
 * 
 * @example
 * <MultiCategoryGate categories={['budget', 'leads']} mode="any">
 *   <ROISection />
 * </MultiCategoryGate>
 */
export function MultiCategoryGate({ 
  categories, 
  mode = 'any',
  children, 
  fallback = null,
  loadingSkeleton,
  showLoadingSkeleton = true,
}: MultiCategoryGateProps) {
  const { canSeeCategory, isLoading } = useDataVisibility();

  if (isLoading) {
    if (!showLoadingSkeleton) return null;
    return <>{loadingSkeleton ?? <Skeleton variant="rectangular" height={60} className="w-full" />}</>;
  }

  const check = mode === 'any'
    ? categories.some(cat => canSeeCategory(cat))
    : categories.every(cat => canSeeCategory(cat));

  if (!check) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
