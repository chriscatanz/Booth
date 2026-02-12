'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as lookupService from '@/services/lookup-service';
import type {
  ShippingCarrier,
  TeamMember,
  Hotel,
  Venue,
  LeadCaptureSystem,
  VirtualPlatform,
  ManagementCompany,
  LaborCompany,
  BoothSize,
  SwagItem,
} from '@/types/lookups';

interface Lookups {
  shippingCarriers: ShippingCarrier[];
  teamMembers: TeamMember[];
  hotels: Hotel[];
  venues: Venue[];
  leadCaptureSystems: LeadCaptureSystem[];
  virtualPlatforms: VirtualPlatform[];
  managementCompanies: ManagementCompany[];
  laborCompanies: LaborCompany[];
  boothSizes: BoothSize[];
  swagItems: SwagItem[];
}

interface UseLookups {
  lookups: Lookups;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshCategory: (category: keyof Lookups) => Promise<void>;
  seedAllCommon: () => Promise<void>;
}

const emptyLookups: Lookups = {
  shippingCarriers: [],
  teamMembers: [],
  hotels: [],
  venues: [],
  leadCaptureSystems: [],
  virtualPlatforms: [],
  managementCompanies: [],
  laborCompanies: [],
  boothSizes: [],
  swagItems: [],
};

export function useLookups(): UseLookups {
  const { organization } = useAuthStore();
  const [lookups, setLookups] = useState<Lookups>(emptyLookups);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!organization?.id) {
      setLookups(emptyLookups);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        shippingCarriers,
        teamMembers,
        hotels,
        venues,
        leadCaptureSystems,
        virtualPlatforms,
        managementCompanies,
        laborCompanies,
        boothSizes,
        swagItems,
      ] = await Promise.all([
        lookupService.getShippingCarriers(organization.id),
        lookupService.getTeamMembers(organization.id),
        lookupService.getHotels(organization.id),
        lookupService.getVenues(organization.id),
        lookupService.getLeadCaptureSystems(organization.id),
        lookupService.getVirtualPlatforms(organization.id),
        lookupService.getManagementCompanies(organization.id),
        lookupService.getLaborCompanies(organization.id),
        lookupService.getBoothSizes(organization.id),
        lookupService.getSwagItems(organization.id),
      ]);

      setLookups({
        shippingCarriers,
        teamMembers,
        hotels,
        venues,
        leadCaptureSystems,
        virtualPlatforms,
        managementCompanies,
        laborCompanies,
        boothSizes,
        swagItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lookups');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const refreshCategory = useCallback(async (category: keyof Lookups) => {
    if (!organization?.id) return;

    try {
      let data: unknown;
      switch (category) {
        case 'shippingCarriers':
          data = await lookupService.getShippingCarriers(organization.id);
          break;
        case 'teamMembers':
          data = await lookupService.getTeamMembers(organization.id);
          break;
        case 'hotels':
          data = await lookupService.getHotels(organization.id);
          break;
        case 'venues':
          data = await lookupService.getVenues(organization.id);
          break;
        case 'leadCaptureSystems':
          data = await lookupService.getLeadCaptureSystems(organization.id);
          break;
        case 'virtualPlatforms':
          data = await lookupService.getVirtualPlatforms(organization.id);
          break;
        case 'managementCompanies':
          data = await lookupService.getManagementCompanies(organization.id);
          break;
        case 'laborCompanies':
          data = await lookupService.getLaborCompanies(organization.id);
          break;
        case 'boothSizes':
          data = await lookupService.getBoothSizes(organization.id);
          break;
        case 'swagItems':
          data = await lookupService.getSwagItems(organization.id);
          break;
      }
      
      setLookups(prev => ({ ...prev, [category]: data }));
    } catch (err) {
      console.error(`Failed to refresh ${category}:`, err);
    }
  }, [organization?.id]);

  const seedAllCommon = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      await lookupService.seedAllCommonData(organization.id);
      await loadAll();
    } catch (err) {
      console.error('Failed to seed common data:', err);
      throw err;
    }
  }, [organization?.id, loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    lookups,
    isLoading,
    error,
    refresh: loadAll,
    refreshCategory,
    seedAllCommon,
  };
}

// Convenience hooks for individual lookup types
export function useShippingCarriers() {
  const { lookups, refreshCategory } = useLookups();
  return {
    carriers: lookups.shippingCarriers,
    refresh: () => refreshCategory('shippingCarriers'),
  };
}

export function useTeamMembers() {
  const { lookups, refreshCategory } = useLookups();
  return {
    members: lookups.teamMembers,
    refresh: () => refreshCategory('teamMembers'),
  };
}

export function useHotels() {
  const { lookups, refreshCategory } = useLookups();
  return {
    hotels: lookups.hotels,
    refresh: () => refreshCategory('hotels'),
  };
}

export function useVenues() {
  const { lookups, refreshCategory } = useLookups();
  return {
    venues: lookups.venues,
    refresh: () => refreshCategory('venues'),
  };
}

export function useBoothSizes() {
  const { lookups, refreshCategory } = useLookups();
  return {
    sizes: lookups.boothSizes,
    refresh: () => refreshCategory('boothSizes'),
  };
}
