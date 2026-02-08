'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TradeShow, Attendee } from '@/types';
import { parseJsonStringArray } from '@/types/computed';
import { formatDate, formatDateRange } from '@/lib/date-utils';
import { X, Printer, Download, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PackingListModalProps {
  show: TradeShow;
  attendees: Attendee[];
  onClose: () => void;
}

export function PackingListModal({ show, attendees, onClose }: PackingListModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const boothItems = parseJsonStringArray(show.boothToShip);
  const graphicsItems = parseJsonStringArray(show.graphicsToShip);
  const packingItems = parseJsonStringArray(show.packingListItems);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List - ${show.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 16px; margin: 16px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 16px; }
            .checklist { list-style: none; }
            .checklist li { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; }
            .checkbox { width: 18px; height: 18px; border: 2px solid #333; border-radius: 3px; flex-shrink: 0; }
            .notes { margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
            .notes h3 { font-size: 14px; margin-bottom: 8px; }
            .attendees { margin-top: 16px; }
            .attendee { padding: 8px 0; border-bottom: 1px solid #eee; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-brand-purple" />
            <h2 className="text-lg font-semibold text-text-primary">Packing List</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer size={14} /> Print
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef}>
            <h1>{show.name}</h1>
            <div className="meta">
              <p>{show.location} • {formatDateRange(show.startDate, show.endDate)}</p>
              {show.boothNumber && <p>Booth: {show.boothNumber} {show.boothSize && `(${show.boothSize})`}</p>}
              {show.shippingCutoff && <p>Ship by: {formatDate(show.shippingCutoff)}</p>}
            </div>

            {boothItems.length > 0 && (
              <>
                <h2>Booth Equipment</h2>
                <ul className="checklist">
                  {boothItems.map((item, i) => (
                    <li key={i}>
                      <div className="checkbox" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {graphicsItems.length > 0 && (
              <>
                <h2>Graphics</h2>
                <ul className="checklist">
                  {graphicsItems.map((item, i) => (
                    <li key={i}>
                      <div className="checkbox" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {packingItems.length > 0 && (
              <>
                <h2>Packing List Items</h2>
                <ul className="checklist">
                  {packingItems.map((item, i) => (
                    <li key={i}>
                      <div className="checkbox" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Additional items */}
            <h2>Additional Items</h2>
            <ul className="checklist">
              {show.tableclothType && (
                <li>
                  <div className="checkbox" />
                  <span>Tablecloth ({show.tableclothType})</span>
                </li>
              )}
              {show.powerStripCount && show.powerStripCount > 0 && (
                <li>
                  <div className="checkbox" />
                  <span>Power Strips (x{show.powerStripCount})</span>
                </li>
              )}
              {show.swagItemsEnabled && show.swagItemsDescription && (
                <li>
                  <div className="checkbox" />
                  <span>Swag: {show.swagItemsDescription}</span>
                </li>
              )}
              {show.giveawayItemEnabled && show.giveawayItemDescription && (
                <li>
                  <div className="checkbox" />
                  <span>Giveaway: {show.giveawayItemDescription}</span>
                </li>
              )}
              {show.packingListMisc && (
                <li>
                  <div className="checkbox" />
                  <span>{show.packingListMisc}</span>
                </li>
              )}
            </ul>

            {attendees.length > 0 && (
              <div className="attendees">
                <h2>Attendees ({attendees.length})</h2>
                {attendees.map((att, i) => (
                  <div key={att.localId} className="attendee">
                    <strong>{att.name || `Attendee ${i + 1}`}</strong>
                    {att.email && <span> ({att.email})</span>}
                    {att.arrivalDate && <div>Arrival: {formatDate(att.arrivalDate)}</div>}
                    {att.flightConfirmation && <div>Flight Conf: {att.flightConfirmation}</div>}
                  </div>
                ))}
              </div>
            )}

            {(show.shippingInfo || show.trackingNumber) && (
              <div className="notes">
                <h3>Shipping Notes</h3>
                {show.shippingInfo && <p>{show.shippingInfo}</p>}
                {show.trackingNumber && <p>Tracking: {show.trackingNumber}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer size={14} /> Print Packing List
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
