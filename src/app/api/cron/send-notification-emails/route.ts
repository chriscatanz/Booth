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

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // SECURITY: Always require CRON_SECRET when set, fail secure otherwise
    if (!cronSecret) {
      console.error('CRON_SECRET not configured - rejecting request');
      return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Cron auth failed - invalid or missing token');
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
      console.error('Cron: Failed to fetch notifications:', fetchError);
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
        // Skip if no user_id (org-wide notifications not supported for email yet)
        if (!notification.user_id) {
          skipped++;
          continue;
        }

        // Get user's email preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('email_enabled')
          .eq('user_id', notification.user_id)
          .eq('organization_id', notification.organization_id)
          .single();

        // Skip if user doesn't have email enabled (default to false if no prefs)
        if (!prefs?.email_enabled) {
          skipped++;
          // Mark as "sent" so we don't reprocess
          await supabase
            .from('notifications')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          continue;
        }

        // Get user's email from decrypted view
        const { data: user } = await supabase
          .from('v_user_profiles')
          .select('email')
          .eq('id', notification.user_id)
          .single();

        if (!user?.email) {
          skipped++;
          continue;
        }

        // Build email data
        const show = notification.tradeshows as unknown as { name: string; location: string; start_date: string } | null;
        const task = notification.tasks as unknown as { title: string; due_date: string } | null;

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
        console.error(`Cron: Failed to send notification ${notification.id}:`, err);
      }
    }

    console.log(`Cron: Notification emails sent=${sent}, skipped=${skipped}, errors=${errors.length}`);

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron: Notification email error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
