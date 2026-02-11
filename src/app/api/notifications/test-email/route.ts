import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotificationEmail } from '@/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.slice(7);
    
    // Create client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user's email from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const email = profile?.email || user.email;
    if (!email) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    // Send test email
    await sendNotificationEmail(email, {
      type: 'general',
      title: 'Test Email from Booth 🎉',
      message: `Hey${profile?.full_name ? ` ${profile.full_name.split(' ')[0]}` : ''}! This is a test notification email. If you're reading this, your email notifications are working perfectly.`,
      priority: 'normal',
      actionUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://getbooth.io',
    });

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${email}` 
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
