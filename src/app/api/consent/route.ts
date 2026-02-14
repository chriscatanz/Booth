import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Current versions - update these when ToS/Privacy change
export const CURRENT_TOS_VERSION = '2024-02-14';
export const CURRENT_PRIVACY_VERSION = '2024-02-14';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, tosAccepted, privacyAccepted, userAgent } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get IP address from headers
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = new Date().toISOString();
    const consentRecords = [];

    // Update user_profiles with consent data
    const profileUpdate: Record<string, string | null> = {
      signup_ip_address: ipAddress,
    };

    if (tosAccepted) {
      profileUpdate.tos_accepted_at = now;
      profileUpdate.tos_version = CURRENT_TOS_VERSION;
      consentRecords.push({
        user_id: userId,
        consent_type: 'tos',
        version: CURRENT_TOS_VERSION,
        accepted_at: now,
        ip_address: ipAddress,
        user_agent: userAgent || null,
      });
    }

    if (privacyAccepted) {
      profileUpdate.privacy_accepted_at = now;
      profileUpdate.privacy_version = CURRENT_PRIVACY_VERSION;
      consentRecords.push({
        user_id: userId,
        consent_type: 'privacy',
        version: CURRENT_PRIVACY_VERSION,
        accepted_at: now,
        ip_address: ipAddress,
        user_agent: userAgent || null,
      });
    }

    // Update user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile consent:', profileError);
      // Don't fail signup for this - log and continue
    }

    // Insert consent log records (audit trail)
    if (consentRecords.length > 0) {
      const { error: logError } = await supabaseAdmin
        .from('consent_log')
        .insert(consentRecords);

      if (logError) {
        console.error('Error logging consent:', logError);
        // Don't fail signup for this - log and continue
      }
    }

    return NextResponse.json({ 
      success: true,
      tosVersion: CURRENT_TOS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
    });
  } catch (error) {
    console.error('Consent recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current versions (useful for re-consent flows)
export async function GET() {
  return NextResponse.json({
    tosVersion: CURRENT_TOS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
  });
}
