import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInvitationEmail } from '@/services/email-service';

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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create Supabase client with the user's token
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
    const { email, inviterName, organizationName, role, token, expiresAt } = body;

    // Validate and sanitize required fields
    const sanitizedEmail = sanitizeString(email, 320);
    const sanitizedInviterName = sanitizeString(inviterName, 100);
    const sanitizedOrgName = sanitizeString(organizationName, 100);
    const sanitizedRole = sanitizeString(role, 20);
    const sanitizedToken = sanitizeString(token, 100);

    if (!sanitizedEmail || !sanitizedInviterName || !sanitizedOrgName || !sanitizedRole || !sanitizedToken || !expiresAt) {
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

    // Validate expiry date is in the future
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be in the future' },
        { status: 400 }
      );
    }

    // Send the invitation email
    await sendInvitationEmail(
      sanitizedEmail,
      sanitizedInviterName,
      sanitizedOrgName,
      sanitizedRole,
      sanitizedToken,
      expiresAt
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send invitation email:', msg);
    return NextResponse.json(
      { error: `Failed to send invitation email: ${msg}` },
      { status: 500 }
    );
  }
}
