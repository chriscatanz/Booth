import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviterName, organizationName, role, token, expiresAt } = body;

    // Validate required fields
    if (!email || !inviterName || !organizationName || !role || !token || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the invitation email
    await sendInvitationEmail(
      email,
      inviterName,
      organizationName,
      role,
      token,
      expiresAt
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    );
  }
}
