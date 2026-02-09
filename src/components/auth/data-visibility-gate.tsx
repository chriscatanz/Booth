'use client';

import React from 'react';
import { useDataVisibility } from '@/hooks/use-data-visibility';
import { DataCategory } from '@/types/data-visibility';

interface DataVisibilityGateProps {
  category: DataCategory;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on role-based data visibility settings.
 * Wraps content that should only be visible to roles with access to the specified category.
 * 
 * @example
 * <DataVisibilityGate category="budget">
 *   <BudgetSection />
 * </DataVisibilityGate>
 */
export function DataVisibilityGate({ 
  category, 
  children, 
  fallback = null 
}: DataVisibilityGateProps) {
  const { canSeeCategory, isLoading } = useDataVisibility();

  // While loading, show nothing (or could show a skeleton)
  if (isLoading) return null;

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
  fallback = null 
}: FieldVisibilityGateProps) {
  const { canSeeField, isLoading } = useDataVisibility();

  if (isLoading) return null;

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
  fallback = null 
}: MultiCategoryGateProps) {
  const { canSeeCategory, isLoading } = useDataVisibility();

  if (isLoading) return null;

  const check = mode === 'any'
    ? categories.some(cat => canSeeCategory(cat))
    : categories.every(cat => canSeeCategory(cat));

  if (!check) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
