import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Helper to format date as iCalendar all-day date (YYYYMMDD)
function formatICSDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// Helper to format date with time (for DTSTAMP)
function formatICSDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Escape special characters for ICS text fields
function escapeICS(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// Generate a deterministic UID for an event
function generateUID(showId: number, orgId: string): string {
  return `show-${showId}@${orgId}.booth.app`;
}

export async function GET(request: NextRequest) {
  try {
    // Check for service role key first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Calendar API: SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ 
        error: 'Calendar sync not configured. Please add SUPABASE_SERVICE_ROLE_KEY to environment variables.' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing calendar token' }, { status: 401 });
    }

    // Look up organization by calendar token
    const { data: org, error: orgError } = await getSupabase()
      .from('organizations')
      .select('id, name, settings')
      .eq('settings->>calendarToken', token)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid calendar token' }, { status: 401 });
    }

    // Fetch all non-template trade shows for this org
    const { data: shows, error: showsError } = await getSupabase()
      .from('tradeshows')
      .select('id, name, location, start_date, end_date, booth_number, show_status, general_notes')
      .eq('organization_id', org.id)
      .eq('is_template', false)
      .order('start_date', { ascending: true });

    if (showsError) {
      console.error('Calendar fetch error:', showsError);
      return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 });
    }

    // Build ICS content
    const now = formatICSDateTime(new Date());
    const calendarName = `${org.name} Trade Shows`;

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Booth//Trade Show Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICS(calendarName)}`,
      `X-WR-CALDESC:Trade shows and events for ${escapeICS(org.name)}`,
    ];

    for (const show of shows || []) {
      const startDate = formatICSDate(show.start_date);
      const endDate = formatICSDate(show.end_date);

      // Skip shows without dates
      if (!startDate) continue;

      // For all-day events, end date should be day after (exclusive)
      let adjustedEndDate = endDate;
      if (endDate) {
        const end = new Date(show.end_date);
        end.setDate(end.getDate() + 1);
        adjustedEndDate = end.toISOString().slice(0, 10).replace(/-/g, '');
      } else {
        // Single-day event: end is day after start
        const start = new Date(show.start_date);
        start.setDate(start.getDate() + 1);
        adjustedEndDate = start.toISOString().slice(0, 10).replace(/-/g, '');
      }

      // Build description
      const descParts: string[] = [];
      if (show.booth_number) descParts.push(`Booth: ${show.booth_number}`);
      if (show.show_status) descParts.push(`Status: ${show.show_status}`);
      if (show.general_notes) descParts.push(`\n${show.general_notes}`);
      const description = escapeICS(descParts.join('\n'));

      ics.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(show.id, org.id)}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${adjustedEndDate}`,
        `SUMMARY:${escapeICS(show.name)}`,
        show.location ? `LOCATION:${escapeICS(show.location)}` : '',
        description ? `DESCRIPTION:${description}` : '',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');

    // Filter out empty lines and join
    const icsContent = ics.filter(line => line).join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate or regenerate calendar token for an org
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.slice(7);
    
    // Verify the user
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { organizationId, regenerate } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check user is admin of this org
    const { data: membership } = await getSupabase()
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current org settings
    const { data: org } = await getSupabase()
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    const currentSettings = org?.settings || {};
    
    // Generate new token if needed
    let calendarToken = currentSettings.calendarToken;
    if (!calendarToken || regenerate) {
      calendarToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }

    // Update org settings
    const { error: updateError } = await getSupabase()
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          calendarToken,
          calendarEnabled: true,
        },
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Calendar token update error:', updateError);
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
    }

    // Build calendar URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const calendarUrl = `${baseUrl}/api/calendar?token=${calendarToken}`;

    return NextResponse.json({
      success: true,
      calendarUrl,
      token: calendarToken,
    });
  } catch (error) {
    console.error('Calendar token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Disable calendar sync
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.slice(7);
    
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check user is admin
    const { data: membership } = await getSupabase()
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current settings and remove calendar token
    const { data: org } = await getSupabase()
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    const { calendarToken, calendarEnabled, ...restSettings } = (org?.settings || {}) as Record<string, unknown>;

    await getSupabase()
      .from('organizations')
      .update({
        settings: {
          ...restSettings,
          calendarEnabled: false,
        },
      })
      .eq('id', organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
