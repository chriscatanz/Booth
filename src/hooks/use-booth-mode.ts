'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { TradeShow } from '@/types';

const BOOTH_MODE_KEY = 'booth_mode_active';
const BOOTH_MODE_SHOW_KEY = 'booth_mode_show_id';

function mapShowFromRow(row: Record<string, unknown>): TradeShow {
  return {
    id: row.id as number,
    name: row.name as string,
    location: row.location as string | null,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    boothNumber: row.booth_number as string | null,
    boothSizeId: row.booth_size_id as string | null,
    boothSize: row.booth_size as string | null,
    cost: row.cost as number | null,
    attendeesIncluded: row.attendees_included as number | null,
    totalAttending: row.total_attending as number | null,
    totalLeads: row.total_leads as number | null,
    managementCompanyId: row.management_company_id as string | null,
    managementCompany: row.management_company as string | null,
    eventType: row.event_type as TradeShow['eventType'],
    virtualPlatformId: row.virtual_platform_id as string | null,
    virtualPlatform: row.virtual_platform as string | null,
    virtualPlatformUrl: row.virtual_platform_url as string | null,
    virtualBoothUrl: row.virtual_booth_url as string | null,
    registrationConfirmed: row.registration_confirmed as boolean | null,
    attendeeListReceived: row.attendee_list_received as boolean | null,
    shippingInfo: row.shipping_info as string | null,
    trackingNumber: row.tracking_number as string | null,
    shippingCost: row.shipping_cost as number | null,
    shipToSite: row.ship_to_site as boolean | null,
    shipToWarehouse: row.ship_to_warehouse as boolean | null,
    shippingCutoff: row.shipping_cutoff as string | null,
    shippingLabelPath: row.shipping_label_path as string | null,
    trackingStatus: row.tracking_status as string | null,
    trackingStatusDetails: row.tracking_status_details as string | null,
    trackingEta: row.tracking_eta as string | null,
    trackingLastUpdated: row.tracking_last_updated as string | null,
    shippingCarrierId: row.shipping_carrier_id as string | null,
    returnCarrierId: row.return_carrier_id as string | null,
    returnTrackingNumber: row.return_tracking_number as string | null,
    returnShippingCost: row.return_shipping_cost as number | null,
    returnShipDate: row.return_ship_date as string | null,
    returnDeliveryDate: row.return_delivery_date as string | null,
    moveInDate: row.move_in_date as string | null,
    moveInTime: row.move_in_time as string | null,
    moveOutDate: row.move_out_date as string | null,
    moveOutTime: row.move_out_time as string | null,
    leadCaptureSystemId: row.lead_capture_system_id as string | null,
    leadCaptureSystem: row.lead_capture_system as string | null,
    leadCaptureCredentials: row.lead_capture_credentials as string | null,
    leadCaptureNotRequired: row.lead_capture_not_required as boolean | null,
    boothToShip: row.booth_to_ship as string | null,
    graphicsToShip: row.graphics_to_ship as string | null,
    utilitiesBooked: row.utilities_booked as boolean | null,
    utilitiesDetails: row.utilities_details as string | null,
    laborBooked: row.labor_booked as boolean | null,
    laborNotRequired: row.labor_not_required as boolean | null,
    laborCompanyId: row.labor_company_id as string | null,
    laborDetails: row.labor_details as string | null,
    electricalCost: row.electrical_cost as number | null,
    laborCost: row.labor_cost as number | null,
    internetCost: row.internet_cost as number | null,
    standardServicesCost: row.standard_services_cost as number | null,
    hasSpeakingEngagement: row.has_speaking_engagement as boolean | null,
    speakingDetails: row.speaking_details as string | null,
    sponsorshipDetails: row.sponsorship_details as string | null,
    hotelId: row.hotel_id as string | null,
    hotelName: row.hotel_name as string | null,
    hotelAddress: row.hotel_address as string | null,
    hotelConfirmed: row.hotel_confirmed as boolean | null,
    hotelCostPerNight: row.hotel_cost_per_night as number | null,
    hotelConfirmationNumber: row.hotel_confirmation_number as string | null,
    hotelConfirmationPath: row.hotel_confirmation_path as string | null,
    showAgendaUrl: row.show_agenda_url as string | null,
    showAgendaPdfPath: row.show_agenda_pdf_path as string | null,
    agendaContent: row.agenda_content as string | null,
    eventPortalUrl: row.event_portal_url as string | null,
    hasEventApp: row.has_event_app as boolean | null,
    eventAppNotes: row.event_app_notes as string | null,
    showContactName: row.show_contact_name as string | null,
    showContactEmail: row.show_contact_email as string | null,
    showContactPhone: row.show_contact_phone as string | null,
    showWebsite: row.show_website as string | null,
    venueId: row.venue_id as string | null,
    venueName: row.venue_name as string | null,
    venueAddress: row.venue_address as string | null,
    packingListItems: row.packing_list_items as string | null,
    swagItemsEnabled: row.swag_items_enabled as boolean | null,
    swagItemsDescription: row.swag_items_description as string | null,
    giveawayItemEnabled: row.giveaway_item_enabled as boolean | null,
    giveawayItemDescription: row.giveaway_item_description as string | null,
    powerStripCount: row.power_strip_count as number | null,
    tableclothType: row.tablecloth_type as string | null,
    packingListMisc: row.packing_list_misc as string | null,
    vendorPacketPath: row.vendor_packet_path as string | null,
    generalNotes: row.general_notes as string | null,
    showStatus: row.show_status as string | null,
    qualifiedLeads: row.qualified_leads as number | null,
    meetingsBooked: row.meetings_booked as number | null,
    dealsWon: row.deals_won as number | null,
    revenueAttributed: row.revenue_attributed as number | null,
    postShowNotes: row.post_show_notes as string | null,
    isTemplate: row.is_template as boolean | null,
    organizationId: row.organization_id as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}

export interface BoothModeState {
  /** Active show for booth mode (if opted in) */
  activeShow: TradeShow | null;
  /** Show we detected but user hasn't accepted yet */
  pendingShow: TradeShow | null;
  /** Whether user has accepted booth mode */
  isInBoothMode: boolean;
  /** Whether we're on mobile */
  isMobile: boolean;
  /** Accept booth mode for the pending show */
  enterBoothMode: () => void;
  /** Dismiss the prompt without entering */
  dismissPrompt: () => void;
  /** Exit booth mode and return to normal app */
  exitBoothMode: () => void;
}

export function useBoothMode(): BoothModeState {
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [pendingShow, setPendingShow] = useState<TradeShow | null>(null);
  const [activeShow, setActiveShow] = useState<TradeShow | null>(null);
  const [isInBoothMode, setIsInBoothMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Detect active show for this user
  useEffect(() => {
    if (!user || !isMobile || dismissed) return;

    async function detectActiveShow() {
      if (!supabase || !user) return;

      const today = new Date().toISOString().split('T')[0];

      // Check if already in booth mode from localStorage
      const savedActive = localStorage.getItem(BOOTH_MODE_KEY);
      const savedShowId = localStorage.getItem(BOOTH_MODE_SHOW_KEY);

      if (savedActive === 'true' && savedShowId) {
        // Restore the active show
        const { data: shows } = await supabase
          .from('v_tradeshows')
          .select('*')
          .eq('id', parseInt(savedShowId, 10))
          .limit(1);

        if (shows && shows.length > 0) {
          setActiveShow(mapShowFromRow(shows[0] as Record<string, unknown>));
          setIsInBoothMode(true);
          return;
        }
        // Show no longer valid — clear storage
        localStorage.removeItem(BOOTH_MODE_KEY);
        localStorage.removeItem(BOOTH_MODE_SHOW_KEY);
      }

      // Find tradeshows where this user is an attendee and live today
      // Use v_attendees (decrypted view) since email column is PII-encrypted
      const { data: attendeeRows } = await supabase
        .from('v_attendees')
        .select('tradeshow_id')
        .eq('email', user.email ?? '');

      if (!attendeeRows || attendeeRows.length === 0) return;

      const showIds = (attendeeRows as Array<{ tradeshow_id: number | null }>)
        .map(r => r.tradeshow_id)
        .filter((id): id is number => id !== null);
      if (showIds.length === 0) return;

      const { data: shows } = await supabase
        .from('v_tradeshows')
        .select('*')
        .in('id', showIds)
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(1);

      if (shows && shows.length > 0) {
        setPendingShow(mapShowFromRow(shows[0] as Record<string, unknown>));
      }
    }

    detectActiveShow();
  }, [user, isMobile, dismissed]);

  const enterBoothMode = useCallback(() => {
    if (!pendingShow) return;
    localStorage.setItem(BOOTH_MODE_KEY, 'true');
    localStorage.setItem(BOOTH_MODE_SHOW_KEY, String(pendingShow.id));
    setActiveShow(pendingShow);
    setPendingShow(null);
    setIsInBoothMode(true);
  }, [pendingShow]);

  const dismissPrompt = useCallback(() => {
    setPendingShow(null);
    setDismissed(true);
  }, []);

  const exitBoothMode = useCallback(() => {
    localStorage.removeItem(BOOTH_MODE_KEY);
    localStorage.removeItem(BOOTH_MODE_SHOW_KEY);
    setIsInBoothMode(false);
    setActiveShow(null);
    setPendingShow(null);
  }, []);

  return {
    activeShow,
    pendingShow,
    isInBoothMode,
    isMobile,
    enterBoothMode,
    dismissPrompt,
    exitBoothMode,
  };
}
