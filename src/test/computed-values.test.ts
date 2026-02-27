import { describe, it, expect } from 'vitest';
import { 
  totalEstimatedCost, 
  totalServicesCost, 
  estimatedHotelCost,
  daysUntilShow,
  roiPercentage,
  costPerLead,
  parseJsonStringArray,
} from '@/types/computed';
import { TradeShow } from '@/types';

// Helper to create a minimal TradeShow object
const createShow = (overrides: Partial<TradeShow> = {}): TradeShow => ({
  id: 1,
  name: 'Test Show',
  location: null,
  startDate: null,
  endDate: null,
  boothNumber: null,
  boothSizeId: null,
  boothSize: null,
  cost: null,
  attendeesIncluded: null,
  totalAttending: null,
  totalLeads: null,
  managementCompanyId: null,
  managementCompany: null,
  eventType: null,
  virtualPlatformId: null,
  virtualPlatform: null,
  virtualPlatformUrl: null,
  virtualBoothUrl: null,
  registrationConfirmed: null,
  attendeeListReceived: null,
  shippingInfo: null,
  trackingNumber: null,
  shippingCost: null,
  shipToSite: null,
  shipToWarehouse: null,
  shippingCutoff: null,
  shippingLabelPath: null,
  trackingStatus: null,
  trackingStatusDetails: null,
  trackingEta: null,
  trackingLastUpdated: null,
  shippingCarrierId: null,
  returnCarrierId: null,
  returnTrackingNumber: null,
  returnShippingCost: null,
  returnShipDate: null,
  returnDeliveryDate: null,
  moveInDate: null,
  moveInTime: null,
  moveOutDate: null,
  moveOutTime: null,
  leadCaptureSystemId: null,
  leadCaptureSystem: null,
  leadCaptureCredentials: null,
  leadCaptureAppUrl: null,
  leadCaptureNotRequired: null,
  boothToShip: null,
  graphicsToShip: null,
  utilitiesBooked: null,
  utilitiesDetails: null,
  laborNotRequired: null,
  laborBooked: null,
  laborCompanyId: null,
  laborDetails: null,
  electricalCost: null,
  laborCost: null,
  internetCost: null,
  standardServicesCost: null,
  hasSpeakingEngagement: null,
  speakingDetails: null,
  sponsorshipDetails: null,
  hotelId: null,
  hotelName: null,
  hotelAddress: null,
  hotelConfirmed: null,
  hotelCostPerNight: null,
  hotelConfirmationNumber: null,
  hotelConfirmationPath: null,
  showAgendaUrl: null,
  showAgendaPdfPath: null,
  agendaContent: null,
  eventPortalUrl: null,
  hasEventApp: null,
  eventAppNotes: null,
  showContactName: null,
  showContactEmail: null,
  showContactPhone: null,
  showWebsite: null,
  venueId: null,
  venueName: null,
  venueAddress: null,
  packingListItems: null,
  swagItemsEnabled: null,
  swagItemsDescription: null,
  giveawayItemEnabled: null,
  giveawayItemDescription: null,
  powerStripCount: null,
  tableclothType: null,
  packingListMisc: null,
  vendorPacketPath: null,
  generalNotes: null,
  showStatus: null,
  qualifiedLeads: null,
  meetingsBooked: null,
  dealsWon: null,
  revenueAttributed: null,
  postShowNotes: null,
  isTemplate: null,
  organizationId: null,
  createdBy: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

describe('TradeShow Computed Values', () => {
  describe('totalEstimatedCost', () => {
    it('returns 0 for show with no costs', () => {
      const show = createShow();
      expect(totalEstimatedCost(show)).toBe(0);
    });

    it('sums booth cost and services', () => {
      const show = createShow({
        cost: 5000,
        electricalCost: 500,
        laborCost: 1000,
        internetCost: 200,
      });
      expect(totalEstimatedCost(show)).toBeGreaterThanOrEqual(6700);
    });

    it('includes shipping costs', () => {
      const show = createShow({
        cost: 1000,
        shippingCost: 500,
      });
      const total = totalEstimatedCost(show);
      // Should include booth cost + shipping
      expect(total).toBeGreaterThanOrEqual(1500);
    });
  });

  describe('totalServicesCost', () => {
    it('returns 0 when no services booked', () => {
      const show = createShow();
      expect(totalServicesCost(show)).toBe(0);
    });

    it('sums all service costs', () => {
      const show = createShow({
        electricalCost: 500,
        laborCost: 1000,
        internetCost: 200,
        standardServicesCost: 300,
      });
      expect(totalServicesCost(show)).toBe(2000);
    });
  });

  describe('estimatedHotelCost', () => {
    it('returns 0 when no hotel info', () => {
      const show = createShow();
      expect(estimatedHotelCost(show)).toBe(0);
    });

    it('calculates based on nights and rate', () => {
      const show = createShow({
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        hotelCostPerNight: 150,
      });
      // 3 nights (arrive day before, leave day of end)
      expect(estimatedHotelCost(show)).toBeGreaterThan(0);
    });
  });

  describe('daysUntilShow', () => {
    it('returns null for show without date', () => {
      const show = createShow();
      expect(daysUntilShow(show)).toBeNull();
    });

    it('returns positive number for future show', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const show = createShow({
        startDate: futureDate.toISOString().split('T')[0],
      });
      const days = daysUntilShow(show);
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('returns negative number for past show', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const show = createShow({
        startDate: pastDate.toISOString().split('T')[0],
      });
      expect(daysUntilShow(show)).toBeLessThan(0);
    });
  });

  describe('roiPercentage', () => {
    it('returns null when no revenue or cost', () => {
      const show = createShow();
      expect(roiPercentage(show)).toBeNull();
    });

    it('calculates positive ROI correctly', () => {
      const show = createShow({
        cost: 10000,
        revenueAttributed: 50000,
      });
      const roi = roiPercentage(show);
      expect(roi).toBeGreaterThan(0);
    });
  });

  describe('costPerLead', () => {
    it('returns null when no leads', () => {
      const show = createShow({ cost: 5000 });
      expect(costPerLead(show)).toBeNull();
    });

    it('calculates cost per lead correctly', () => {
      const show = createShow({
        cost: 5000,
        totalLeads: 100,
      });
      const cpl = costPerLead(show);
      expect(cpl).toBe(50);
    });
  });

  describe('parseJsonStringArray', () => {
    it('parses valid JSON array', () => {
      const result = parseJsonStringArray('["item1", "item2", "item3"]');
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('returns empty array for null', () => {
      expect(parseJsonStringArray(null)).toEqual([]);
    });

    it('returns empty array for invalid JSON', () => {
      expect(parseJsonStringArray('not valid json')).toEqual([]);
    });

    it('returns empty array for non-array JSON', () => {
      expect(parseJsonStringArray('{"key": "value"}')).toEqual([]);
    });
  });
});
