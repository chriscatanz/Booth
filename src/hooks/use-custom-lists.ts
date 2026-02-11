import { useAuthStore } from '@/store/auth-store';
import { 
  CustomLists, 
  DEFAULT_BOOTH_OPTIONS,
  DEFAULT_GRAPHICS_OPTIONS,
  DEFAULT_PACKING_LIST_OPTIONS,
  DEFAULT_TABLECLOTH_OPTIONS,
} from '@/lib/constants';

/**
 * Hook to get customizable list options from organization settings.
 * Falls back to defaults if not configured.
 */
export function useCustomLists(): CustomLists {
  const organization = useAuthStore((state) => state.organization);
  
  const settings = organization?.settings as { customLists?: Partial<CustomLists> } | undefined;
  const customLists = settings?.customLists;

  return {
    boothOptions: customLists?.boothOptions?.length 
      ? customLists.boothOptions 
      : DEFAULT_BOOTH_OPTIONS,
    graphicsOptions: customLists?.graphicsOptions?.length 
      ? customLists.graphicsOptions 
      : DEFAULT_GRAPHICS_OPTIONS,
    packingListOptions: customLists?.packingListOptions?.length 
      ? customLists.packingListOptions 
      : DEFAULT_PACKING_LIST_OPTIONS,
    tableclothOptions: customLists?.tableclothOptions?.length 
      ? customLists.tableclothOptions 
      : DEFAULT_TABLECLOTH_OPTIONS,
  };
}

/**
 * Get custom lists from an organization object directly (for non-hook contexts)
 */
export function getCustomLists(organization: { settings?: Record<string, unknown> } | null): CustomLists {
  const settings = organization?.settings as { customLists?: Partial<CustomLists> } | undefined;
  const customLists = settings?.customLists;

  return {
    boothOptions: customLists?.boothOptions?.length 
      ? customLists.boothOptions 
      : DEFAULT_BOOTH_OPTIONS,
    graphicsOptions: customLists?.graphicsOptions?.length 
      ? customLists.graphicsOptions 
      : DEFAULT_GRAPHICS_OPTIONS,
    packingListOptions: customLists?.packingListOptions?.length 
      ? customLists.packingListOptions 
      : DEFAULT_PACKING_LIST_OPTIONS,
    tableclothOptions: customLists?.tableclothOptions?.length 
      ? customLists.tableclothOptions 
      : DEFAULT_TABLECLOTH_OPTIONS,
  };
}
