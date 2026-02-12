import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

interface ShippoTrackingResponse {
  tracking_status: {
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  eta?: string;
  carrier?: string;
  tracking_number: string;
  tracking_history: Array<{
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  }>;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackingNumber } = await context.params;
    const carrier = request.nextUrl.searchParams.get('carrier');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
    }

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier required' }, { status: 400 });
    }

    if (!SHIPPO_API_KEY) {
      return NextResponse.json({ error: 'Shippo API not configured' }, { status: 500 });
    }

    // Fetch from Shippo API
    const shippoResponse = await fetch(
      `https://api.goshippo.com/tracks/${carrier}/${trackingNumber}`,
      {
        headers: {
          'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shippoResponse.ok) {
      const errorText = await shippoResponse.text();
      console.error('Shippo API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch tracking info' },
        { status: shippoResponse.status }
      );
    }

    const data: ShippoTrackingResponse = await shippoResponse.json();

    // Transform to our format
    const formatLocation = (loc?: { city?: string; state?: string; country?: string }) => {
      if (!loc) return null;
      const parts = [loc.city, loc.state, loc.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : null;
    };

    const result = {
      status: data.tracking_status?.status || 'UNKNOWN',
      statusDetails: data.tracking_status?.status_details || 'No status available',
      eta: data.eta || null,
      carrier: data.carrier || carrier,
      trackingNumber: data.tracking_number || trackingNumber,
      lastUpdated: data.tracking_status?.status_date || new Date().toISOString(),
      trackingHistory: (data.tracking_history || []).map(event => ({
        status: event.status,
        statusDetails: event.status_details,
        location: formatLocation(event.location),
        date: event.status_date,
      })),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
