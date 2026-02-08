'use client';

import { useEffect } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';

export function useTradeShows() {
  const loadShows = useTradeShowStore(s => s.loadShows);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  return useTradeShowStore();
}
