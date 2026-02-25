import { create } from 'zustand';
import { TradeShow, Attendee, AdditionalFile, createNewTradeShow, createNewAttendee } from '@/types';
import { DateRange } from '@/types/enums';
import { shiftDateByOneYear } from '@/lib/date-utils';
import * as api from '@/services/supabase-service';
import * as cache from '@/services/cache-service';
import { validateTradeShow, validateAttendees } from '@/services/validation-service';
import { createActivity } from '@/services/activity-service';
import { useAuthStore } from '@/store/auth-store';

interface TradeShowState {
  // Data
  shows: TradeShow[];
  templates: TradeShow[];
  selectedShow: TradeShow | null;
  attendees: Attendee[];
  allAttendees: Attendee[];
  additionalFiles: AdditionalFile[];

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  isHistorical: boolean;
  errorMessage: string | null;
  validationErrors: string[];

  // Filters
  searchText: string;
  filterLocation: string;
  filterDateRange: DateRange;
  filterStatus: string;

  // Bulk operations
  selectedShowIds: Set<number>;

  // Actions
  loadShows: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  selectShow: (show: TradeShow) => Promise<void>;
  createNewShow: () => void;
  createFromTemplate: (template: TradeShow) => void;
  saveAsTemplate: (name: string) => Promise<boolean>;
  deleteTemplate: (id: number) => Promise<void>;
  saveShow: () => Promise<boolean>;
  deleteShow: () => Promise<void>;
  duplicateShow: () => void;
  repeatYearly: () => void;
  setSelectedShow: (show: TradeShow | null) => void;
  updateSelectedShow: (updates: Partial<TradeShow>) => void;

  // Attendees
  setAttendees: (attendees: Attendee[]) => void;
  addAttendee: () => void;
  removeAttendee: (localId: string) => void;
  updateAttendee: (localId: string, updates: Partial<Attendee>) => void;

  // Files
  refreshAdditionalFiles: () => Promise<void>;

  // Filters
  setSearchText: (text: string) => void;
  setFilterLocation: (location: string) => void;
  setFilterDateRange: (range: DateRange) => void;
  setFilterStatus: (status: string) => void;
  setIsHistorical: (val: boolean) => void;

  // Bulk
  toggleShowSelection: (id: number) => void;
  clearSelection: () => void;
  deleteSelectedShows: () => Promise<void>;

  // Computed
  uniqueLocations: () => string[];
  clearError: () => void;
}

export const useTradeShowStore = create<TradeShowState>((set, get) => ({
  shows: [],
  templates: [],
  selectedShow: null,
  attendees: [],
  allAttendees: [],
  additionalFiles: [],
  isLoading: false,
  isSaving: false,
  isHistorical: false,
  errorMessage: null,
  validationErrors: [],
  searchText: '',
  filterLocation: '',
  filterDateRange: DateRange.All,
  filterStatus: '',
  selectedShowIds: new Set(),

  loadShows: async () => {
    set({ isLoading: true, errorMessage: null });

    // Try cache first
    const historical = get().isHistorical;
    const cacheKey = historical ? 'shows_historical' : 'shows_upcoming';
    const cached = cache.getCached<TradeShow[]>(cacheKey);
    if (cached) {
      set({ shows: cached });
    }

    try {
      const shows = await api.fetchTradeShows(historical);
      cache.setCache(cacheKey, shows);

      // Load all attendees for Quick Look
      let allAtt = get().allAttendees;
      try {
        allAtt = await api.fetchAllAttendees();
        cache.setCache('all_attendees', allAtt);
      } catch {
        const cachedAtt = cache.getCached<Attendee[]>('all_attendees');
        if (cachedAtt) allAtt = cachedAtt;
      }

      set({ shows, allAttendees: allAtt, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load shows';
      set({ errorMessage: msg, isLoading: false });
    }
  },

  selectShow: async (show: TradeShow) => {
    try {
      const [fresh, attendees, files] = await Promise.all([
        api.fetchTradeShow(show.id),
        api.fetchAttendees(show.id),
        api.fetchAdditionalFiles(show.id),
      ]);
      set({ selectedShow: fresh, attendees, additionalFiles: files, validationErrors: [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load show';
      set({ errorMessage: msg });
    }
  },

  createNewShow: () => {
    set({
      selectedShow: createNewTradeShow(),
      attendees: [],
      additionalFiles: [],
      validationErrors: [],
    });
  },

  loadTemplates: async () => {
    try {
      const templates = await api.fetchTemplates();
      set({ templates });
    } catch (err) {
      // Templates are optional, don't show error
      console.warn('Failed to load templates:', err);
    }
  },

  createFromTemplate: (template: TradeShow) => {
    const newShow: TradeShow = {
      ...template,
      id: 0,
      name: `${template.name} (from template)`,
      startDate: null,
      endDate: null,
      shippingCutoff: null,
      registrationConfirmed: false,
      attendeeListReceived: false,
      hotelConfirmed: false,
      hotelConfirmationNumber: null,
      utilitiesBooked: false,
      laborBooked: false,
      laborNotRequired: false,
      leadCaptureNotRequired: false,
      trackingNumber: null,
      shippingLabelPath: null,
      hotelConfirmationPath: null,
      showAgendaUrl: null,
      showAgendaPdfPath: null,
      eventPortalUrl: null,
      vendorPacketPath: null,
      showStatus: 'Planning',
      totalLeads: null,
      qualifiedLeads: null,
      meetingsBooked: null,
      dealsWon: null,
      revenueAttributed: null,
      postShowNotes: null,
      isTemplate: false,
      createdAt: null,
      updatedAt: null,
    };
    set({ selectedShow: newShow, attendees: [], additionalFiles: [], validationErrors: [] });
  },

  saveAsTemplate: async (name: string) => {
    const { selectedShow } = get();
    if (!selectedShow) return false;

    const template: TradeShow = {
      ...selectedShow,
      id: 0,
      name,
      startDate: null,
      endDate: null,
      shippingCutoff: null,
      registrationConfirmed: false,
      attendeeListReceived: false,
      hotelConfirmed: false,
      hotelConfirmationNumber: null,
      utilitiesBooked: false,
      laborBooked: false,
      laborNotRequired: false,
      leadCaptureNotRequired: false,
      trackingNumber: null,
      shippingLabelPath: null,
      hotelConfirmationPath: null,
      showAgendaUrl: null,
      showAgendaPdfPath: null,
      eventPortalUrl: null,
      vendorPacketPath: null,
      showStatus: null,
      totalLeads: null,
      qualifiedLeads: null,
      meetingsBooked: null,
      dealsWon: null,
      revenueAttributed: null,
      postShowNotes: null,
      generalNotes: null,
      isTemplate: true,
      createdAt: null,
      updatedAt: null,
    };

    try {
      await api.createTradeShow(template);
      await get().loadTemplates();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save template';
      set({ errorMessage: msg });
      return false;
    }
  },

  deleteTemplate: async (id: number) => {
    try {
      await api.deleteTradeShow(id);
      await get().loadTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete template';
      set({ errorMessage: msg });
    }
  },

  saveShow: async () => {
    const { selectedShow, attendees, isSaving } = get();
    if (isSaving || !selectedShow) return false;

    // Validate
    const showResult = validateTradeShow(selectedShow);
    const attErrors = validateAttendees(attendees);
    const allErrors = [
      ...showResult.errors,
      ...attErrors.flatMap(({ index, result }) => {
        const name = attendees[index].name || `Attendee ${index + 1}`;
        return result.errors.map(e => `${name}: ${e}`);
      }),
    ];

    if (allErrors.length > 0) {
      set({ validationErrors: allErrors, errorMessage: allErrors[0] });
      return false;
    }

    set({ isSaving: true, validationErrors: [] });

    try {
      let show = selectedShow;
      if (show.id > 0 && get().shows.some(s => s.id === show.id)) {
        await api.updateTradeShow(show);
      } else {
        show = await api.createTradeShow(show);
        set({ selectedShow: show });
        // Update attendee tradeshowId references
        const updated = attendees.map(a => ({ ...a, tradeshowId: show.id }));
        set({ attendees: updated });
        // Activity log — fire and forget
        const { user, organization } = useAuthStore.getState();
        if (user && organization) {
          createActivity(organization.id, user.id, 'show_created', `Created ${show.name}`, {
            showId: show.id.toString(),
          }).catch(() => {});
        }
      }

      await api.saveAttendees(get().attendees, show.id);
      const freshAttendees = await api.fetchAttendees(show.id);
      set({ attendees: freshAttendees });

      await get().loadShows();
      set({ isSaving: false });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      set({ errorMessage: msg, isSaving: false });
      return false;
    }
  },

  deleteShow: async () => {
    const { selectedShow } = get();
    if (!selectedShow) return;

    try {
      await api.deleteTradeShow(selectedShow.id);
      set({ selectedShow: null, attendees: [], additionalFiles: [] });
      await get().loadShows();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      set({ errorMessage: msg });
    }
  },

  duplicateShow: () => {
    const { selectedShow, attendees } = get();
    if (!selectedShow) return;

    const dup: TradeShow = {
      ...selectedShow,
      id: 0,
      name: `${selectedShow.name} (Copy)`,
      startDate: null,
      endDate: null,
      shippingCutoff: null,
      registrationConfirmed: false,
      attendeeListReceived: false,
      hotelConfirmed: false,
      hotelConfirmationNumber: null,
      utilitiesBooked: false,
      laborBooked: false,
      laborNotRequired: false,
      leadCaptureNotRequired: false,
      trackingNumber: null,
      shippingLabelPath: null,
      hotelConfirmationPath: null,
      showAgendaUrl: null,
      showAgendaPdfPath: null,
      eventPortalUrl: null,
      vendorPacketPath: null,
      showStatus: 'Planning',
      totalLeads: null,
      qualifiedLeads: null,
      meetingsBooked: null,
      dealsWon: null,
      revenueAttributed: null,
      postShowNotes: null,
      isTemplate: false,
      createdAt: null,
      updatedAt: null,
    };

    const dupAttendees = attendees.map(att => ({
      ...att,
      dbId: null,
      tradeshowId: null,
      arrivalDate: null,
      departureDate: null,
      flightConfirmation: null,
      localId: crypto.randomUUID(),
    }));

    set({ selectedShow: dup, attendees: dupAttendees, additionalFiles: [] });
  },

  repeatYearly: () => {
    const { selectedShow, attendees } = get();
    if (!selectedShow) return;

    const dup: TradeShow = {
      ...selectedShow,
      id: 0,
      name: selectedShow.name.replace(/\s*\d{4}\s*$/, '') + ` ${new Date().getFullYear() + 1}`,
      startDate: shiftDateByOneYear(selectedShow.startDate),
      endDate: shiftDateByOneYear(selectedShow.endDate),
      shippingCutoff: shiftDateByOneYear(selectedShow.shippingCutoff),
      registrationConfirmed: false,
      attendeeListReceived: false,
      hotelConfirmed: false,
      hotelConfirmationNumber: null,
      utilitiesBooked: false,
      laborBooked: false,
      laborNotRequired: false,
      leadCaptureNotRequired: false,
      trackingNumber: null,
      shippingLabelPath: null,
      hotelConfirmationPath: null,
      showAgendaUrl: null,
      showAgendaPdfPath: null,
      eventPortalUrl: null,
      vendorPacketPath: null,
      showStatus: 'Planning',
      totalLeads: null,
      qualifiedLeads: null,
      meetingsBooked: null,
      dealsWon: null,
      revenueAttributed: null,
      postShowNotes: null,
      generalNotes: selectedShow.generalNotes, // Keep notes for reference
      isTemplate: false,
      createdAt: null,
      updatedAt: null,
    };

    const dupAttendees = attendees.map(att => ({
      ...att,
      dbId: null,
      tradeshowId: null,
      arrivalDate: shiftDateByOneYear(att.arrivalDate),
      departureDate: shiftDateByOneYear(att.departureDate),
      flightCost: null,
      flightConfirmation: null,
      localId: crypto.randomUUID(),
    }));

    set({ selectedShow: dup, attendees: dupAttendees, additionalFiles: [] });
  },

  setSelectedShow: (show) => set({ selectedShow: show }),
  updateSelectedShow: (updates) => {
    const current = get().selectedShow;
    if (!current) return;
    set({ selectedShow: { ...current, ...updates } });
  },

  setAttendees: (attendees) => set({ attendees }),
  addAttendee: () => {
    const { attendees, selectedShow } = get();
    set({ attendees: [...attendees, createNewAttendee(selectedShow?.id ?? undefined)] });
  },
  removeAttendee: (localId) => {
    set({ attendees: get().attendees.filter(a => a.localId !== localId) });
  },
  updateAttendee: (localId, updates) => {
    set({
      attendees: get().attendees.map(a =>
        a.localId === localId ? { ...a, ...updates } : a
      ),
    });
  },

  refreshAdditionalFiles: async () => {
    const show = get().selectedShow;
    if (!show || show.id <= 0) return;
    try {
      const files = await api.fetchAdditionalFiles(show.id);
      set({ additionalFiles: files });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load files';
      set({ errorMessage: msg });
    }
  },

  setSearchText: (text) => set({ searchText: text }),
  setFilterLocation: (location) => set({ filterLocation: location }),
  setFilterDateRange: (range) => set({ filterDateRange: range }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setIsHistorical: (val) => {
    set({ isHistorical: val });
    get().loadShows();
  },

  toggleShowSelection: (id) => {
    const ids = new Set(get().selectedShowIds);
    if (ids.has(id)) ids.delete(id); else ids.add(id);
    set({ selectedShowIds: ids });
  },
  clearSelection: () => set({ selectedShowIds: new Set() }),
  deleteSelectedShows: async () => {
    const ids = get().selectedShowIds;
    for (const id of ids) {
      try { await api.deleteTradeShow(id); } catch { /* continue */ }
    }
    set({ selectedShowIds: new Set(), selectedShow: null, attendees: [], additionalFiles: [] });
    await get().loadShows();
  },

  uniqueLocations: () => {
    const locs = get().shows.map(s => s.location).filter(Boolean) as string[];
    return [...new Set(locs)].sort();
  },

  clearError: () => set({ errorMessage: null }),
}));
