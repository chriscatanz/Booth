import { useMemo } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useDebounce } from './use-debounce';
import { DateRange } from '@/types/enums';
import { TradeShow } from '@/types';
import { parseISO, isValid, isWithinInterval, addDays, startOfMonth, endOfMonth } from 'date-fns';

export function useFilteredShows(): TradeShow[] {
  const shows = useTradeShowStore(s => s.shows);
  const searchText = useTradeShowStore(s => s.searchText);
  const filterLocation = useTradeShowStore(s => s.filterLocation);
  const filterDateRange = useTradeShowStore(s => s.filterDateRange);
  const filterStatus = useTradeShowStore(s => s.filterStatus);
  const allAttendees = useTradeShowStore(s => s.allAttendees);

  const debouncedSearch = useDebounce(searchText, 300);

  return useMemo(() => {
    let result = [...shows];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(show => {
        if (show.name.toLowerCase().includes(search)) return true;
        if (show.location?.toLowerCase().includes(search)) return true;
        if (show.boothNumber?.toLowerCase().includes(search)) return true;
        if (show.managementCompany?.toLowerCase().includes(search)) return true;
        if (show.hotelName?.toLowerCase().includes(search)) return true;
        if (show.generalNotes?.toLowerCase().includes(search)) return true;
        if (show.showContactName?.toLowerCase().includes(search)) return true;
        if (show.showContactEmail?.toLowerCase().includes(search)) return true;
        if (show.sponsorshipDetails?.toLowerCase().includes(search)) return true;
        if (show.trackingNumber?.toLowerCase().includes(search)) return true;
        // Check attendee names
        const showAttendees = allAttendees.filter(a => a.tradeshowId === show.id);
        if (showAttendees.some(a => a.name?.toLowerCase().includes(search))) return true;
        return false;
      });
    }

    // Location filter
    if (filterLocation) {
      result = result.filter(show =>
        show.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(show => show.showStatus === filterStatus);
    }

    // Date range filter
    const now = new Date();
    switch (filterDateRange) {
      case DateRange.ThisMonth: {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        result = result.filter(show => {
          if (!show.startDate) return false;
          const d = parseISO(show.startDate);
          return isValid(d) && isWithinInterval(d, { start: monthStart, end: monthEnd });
        });
        break;
      }
      case DateRange.Next30Days: {
        const end = addDays(now, 30);
        result = result.filter(show => {
          if (!show.startDate) return false;
          const d = parseISO(show.startDate);
          return isValid(d) && d >= now && d <= end;
        });
        break;
      }
      case DateRange.Next90Days: {
        const end = addDays(now, 90);
        result = result.filter(show => {
          if (!show.startDate) return false;
          const d = parseISO(show.startDate);
          return isValid(d) && d >= now && d <= end;
        });
        break;
      }
      default:
        break;
    }

    return result;
  }, [shows, debouncedSearch, filterLocation, filterDateRange, filterStatus, allAttendees]);
}
