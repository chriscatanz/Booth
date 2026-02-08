'use client';

import { useEffect, useCallback } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';

export function useKeyboardShortcuts() {
  const saveShow = useTradeShowStore(s => s.saveShow);
  const createNewShow = useTradeShowStore(s => s.createNewShow);
  const loadShows = useTradeShowStore(s => s.loadShows);
  const selectedShow = useTradeShowStore(s => s.selectedShow);
  const setSelectedShow = useTradeShowStore(s => s.setSelectedShow);
  const shows = useTradeShowStore(s => s.shows);
  const selectShow = useTradeShowStore(s => s.selectShow);

  const navigateShows = useCallback((direction: 'up' | 'down') => {
    if (shows.length === 0) return;
    
    const currentIndex = selectedShow 
      ? shows.findIndex(s => s.id === selectedShow.id)
      : -1;
    
    let nextIndex: number;
    if (direction === 'up') {
      nextIndex = currentIndex <= 0 ? shows.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= shows.length - 1 ? 0 : currentIndex + 1;
    }
    
    selectShow(shows[nextIndex]);
  }, [shows, selectedShow, selectShow]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape in inputs to blur
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      // Non-meta shortcuts
      switch (e.key) {
        case 'Escape':
          if (selectedShow) {
            e.preventDefault();
            setSelectedShow(null);
          }
          return;
        case 'ArrowUp':
        case 'k': // Vim-style navigation
          e.preventDefault();
          navigateShows('up');
          return;
        case 'ArrowDown':
        case 'j': // Vim-style navigation
          e.preventDefault();
          navigateShows('down');
          return;
      }

      // Meta shortcuts
      if (!meta) return;

      switch (e.key) {
        case 's':
          e.preventDefault();
          saveShow();
          break;
        case 'n':
          e.preventDefault();
          createNewShow();
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            loadShows();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveShow, createNewShow, loadShows, selectedShow, setSelectedShow, navigateShows]);
}
