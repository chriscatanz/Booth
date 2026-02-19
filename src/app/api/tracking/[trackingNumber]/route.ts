import { NextRequest, NextResponse } from 'next/server';

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
    // Note: Tracking info is public carrier data, so auth is optional
    // The app UI already requires login to see this page
    
    const { trackingNumber: rawTrackingNumber } = await context.params;
    const carrier = request.nextUrl.searchParams.get('carrier');
    
    // Clean tracking number - remove spaces and special characters
    const trackingNumber = rawTrackingNumber.replace(/\s+/g, '');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
    }

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier required' }, { status: 400 });
    }

    // Read env var inside handler (not at module scope) for proper Next.js runtime behavior
    const shippoApiKey = process.env.SHIPPO_API_KEY;
    if (!shippoApiKey) {
      console.error('Tracking API: SHIPPO_API_KEY not configured');
      return NextResponse.json({ error: 'Shippo API not configured' }, { status: 500 });
    }

    // Fetch from Shippo API
    const shippoResponse = await fetch(
      `https://api.goshippo.com/tracks/${carrier}/${trackingNumber}`,
      {
        headers: {
          'Authorization': `ShippoToken ${shippoApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shippoResponse.ok) {
      const errorText = await shippoResponse.text();
      console.error('Shippo API error:', shippoResponse.status, errorText);
      // Return more specific error for debugging (in prod, could simplify)
      return NextResponse.json(
        { 
          error: 'Failed to fetch tracking info',
          details: shippoResponse.status === 401 ? 'Invalid API key' : errorText 
        },
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
