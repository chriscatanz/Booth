'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Applies the organization's brand color as CSS variables.
 * Updates --brand-purple and related variables dynamically.
 */
export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useAuthStore();

  useEffect(() => {
    const brandColor = organization?.brandColor;
    
    if (brandColor && typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set the main brand color
      root.style.setProperty('--brand-purple', brandColor);
      root.style.setProperty('--color-brand-purple', brandColor);
      
      // Generate lighter and darker variants
      const lighterColor = adjustBrightness(brandColor, 30);
      const darkerColor = adjustBrightness(brandColor, -30);
      
      root.style.setProperty('--brand-purple-light', lighterColor);
      root.style.setProperty('--brand-purple-dark', darkerColor);
      root.style.setProperty('--color-brand-purple-light', lighterColor);
      root.style.setProperty('--color-brand-purple-dark', darkerColor);
    }
    
    // Cleanup: reset to defaults when org changes or unmounts
    return () => {
      if (typeof document !== 'undefined' && !organization?.brandColor) {
        const root = document.documentElement;
        root.style.removeProperty('--brand-purple');
        root.style.removeProperty('--brand-purple-light');
        root.style.removeProperty('--brand-purple-dark');
        root.style.removeProperty('--color-brand-purple');
        root.style.removeProperty('--color-brand-purple-light');
        root.style.removeProperty('--color-brand-purple-dark');
      }
    };
  }, [organization?.brandColor]);

  return <>{children}</>;
}

/**
 * Adjusts hex color brightness.
 * @param hex - Hex color string (e.g., "#9333ea")
 * @param percent - Positive = lighter, negative = darker
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, r + Math.round(r * percent / 100)));
  g = Math.min(255, Math.max(0, g + Math.round(g * percent / 100)));
  b = Math.min(255, Math.max(0, b + Math.round(b * percent / 100)));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
