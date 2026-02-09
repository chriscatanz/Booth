'use client';

import { ThemeProvider } from '@/theme/theme-provider';
import { BrandProvider } from '@/components/providers/brand-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <BrandProvider>{children}</BrandProvider>
    </ThemeProvider>
  );
}
