'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  const resolveTheme = useCallback((m: ThemeMode): ResolvedTheme => {
    if (m === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (stored) {
      setModeState(stored);
      setResolved(resolveTheme(stored));
    }
  }, [resolveTheme]);

  useEffect(() => {
    const r = resolveTheme(mode);
    setResolved(r);
    document.documentElement.classList.toggle('dark', r === 'dark');
    localStorage.setItem('theme-mode', mode);
  }, [mode, resolveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(resolveTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, resolveTheme]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = resolveTheme(prev) === 'light' ? 'dark' : 'light';
      return next;
    });
  }, [resolveTheme]);

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
