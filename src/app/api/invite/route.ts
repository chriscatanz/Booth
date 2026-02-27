import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// HTML entity encoding for XSS prevention
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

// Validate and sanitize string input
function sanitizeString(input: unknown, maxLength: number = 255): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return escapeHtml(trimmed);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via Supabase
    const authHeader = request.headers.get('authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create Supabase client with the user's token (for auth verification + rate limiting)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Database-based rate limiting
    const rateLimitKey = `invite:${user.id}`;
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_key: rateLimitKey,
        p_limit: 10,
        p_window_seconds: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      // Fall through - don't block on rate limit errors
    } else if (rateLimitOk === false) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, role, token } = body;

    // Validate and sanitize required fields
    const sanitizedEmail = sanitizeString(email, 320);
    const sanitizedRole = sanitizeString(role, 20);
    const sanitizedToken = sanitizeString(token, 100);

    if (!sanitizedEmail || !sanitizedRole || !sanitizedToken) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role is one of allowed values
    const allowedRoles = ['admin', 'editor', 'viewer'];
    if (!allowedRoles.includes(sanitizedRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Build the redirect URL — Supabase will append #access_token=...&type=invite to this
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getbooth.io';
    const redirectTo = `${appUrl}/invite/accept?token=${sanitizedToken}`;

    // Send invite via Supabase Auth admin API (one email, pre-confirmed account)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      sanitizedEmail,
      { redirectTo }
    );

    if (inviteError) {
      console.error('Failed to send Supabase invite:', inviteError);
      return NextResponse.json(
        { error: `Failed to send invitation: ${inviteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send invitation:', msg);
    return NextResponse.json(
      { error: `Failed to send invitation: ${msg}` },
      { status: 500 }
    );
  }
}
