import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendNotificationEmail } from '@/services/email-service';

// Lazy init for build compatibility
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

// Simple auth check - can use a secret key for cron jobs
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow if cron secret matches
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Allow if service role key is used
  if (authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check for cron/internal calls
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get unsent notifications where user has email enabled
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        id,
        organization_id,
        user_id,
        type,
        title,
        message,
        priority,
        tradeshow_id,
        task_id,
        action_url,
        tradeshows:tradeshow_id (
          name,
          location,
          start_date
        ),
        tasks:task_id (
          title,
          due_date
        )
      `)
      .is('sent_at', null)
      .is('dismissed_at', null)
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('Failed to fetch notifications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No pending notifications' });
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const notification of notifications) {
      try {
        // Get user's email preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('email_enabled')
          .eq('user_id', notification.user_id)
          .eq('organization_id', notification.organization_id)
          .single();

        // Skip if user doesn't have email enabled
        if (!prefs?.email_enabled) {
          skipped++;
          // Still mark as "sent" to not reprocess
          await supabase
            .from('notifications')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          continue;
        }

        // Get user's email
        const { data: user } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('id', notification.user_id)
          .single();

        if (!user?.email) {
          skipped++;
          continue;
        }

        // Build email data
        const show = notification.tradeshows as { name: string; location: string; start_date: string } | null;
        const task = notification.tasks as { title: string; due_date: string } | null;

        await sendNotificationEmail(user.email, {
          type: notification.type as 'task_due' | 'shipping_cutoff' | 'show_upcoming' | 'general',
          title: notification.title,
          message: notification.message,
          priority: notification.priority as 'low' | 'normal' | 'high' | 'urgent',
          actionUrl: notification.action_url,
          showName: show?.name,
          showDate: show?.start_date ? new Date(show.start_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }) : undefined,
          showLocation: show?.location,
          taskName: task?.title,
          dueDate: task?.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }) : undefined,
        });

        // Mark as sent
        await supabase
          .from('notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', notification.id);

        sent++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Notification ${notification.id}: ${errorMsg}`);
        console.error(`Failed to send notification ${notification.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Notification email API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}

// Also support GET for easy cron triggers (Vercel cron, etc.)
export async function GET(request: NextRequest) {
  return POST(request);
}
