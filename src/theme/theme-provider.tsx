'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { light, dark } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
type ThemeColors = { [K in keyof typeof light]: string };

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Helper to get initial theme from localStorage (client-side only)
function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
  return stored || 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use lazy initialization to read from localStorage on first render
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Derive resolved theme from mode and system preference (no useState needed)
  const resolved = useMemo<ResolvedTheme>(() => {
    if (mode === 'system') return systemPreference;
    return mode;
  }, [mode, systemPreference]);

  // Sync to DOM and localStorage when mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    localStorage.setItem('theme-mode', mode);
  }, [mode, resolved]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(() => {
    setModeState(prev => {
      const current = prev === 'system' ? systemPreference : prev;
      return current === 'light' ? 'dark' : 'light';
    });
  }, [systemPreference]);

  const colors = resolved === 'dark' ? dark : light;

  return (
    <ThemeContext.Provider value={{ mode, resolved, colors, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
