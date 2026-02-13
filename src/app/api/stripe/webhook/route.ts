import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid errors when keys aren't set
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Map Stripe price IDs to tiers
function getTierFromPriceId(priceId: string): 'starter' | 'pro' {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'starter';
}

// Get user limit for tier
function getUserLimitForTier(tier: string): number | null {
  if (tier === 'starter') return 5;
  if (tier === 'pro') return null;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed for org ${session.metadata?.org_id}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

interface SubscriptionRow {
  org_id: string;
  stripe_customer_id?: string;
  status?: string;
}

async function handleSubscriptionUpdate(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.org_id;
  
  // If not in subscription metadata, look up by customer
  let targetOrgId: string | undefined = orgId;
  if (!targetOrgId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('org_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();
    targetOrgId = (data as SubscriptionRow | null)?.org_id;
  }

  if (!targetOrgId) {
    console.error('Could not find org for subscription:', subscription.id);
    return;
  }

  // Get the price to determine tier
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? getTierFromPriceId(priceId) : 'starter';
  const userLimit = getUserLimitForTier(tier);

  // Map Stripe status to our status
  let status: 'active' | 'past_due' | 'cancelled' | 'incomplete' = 'active';
  if (subscription.status === 'past_due') status = 'past_due';
  if (subscription.status === 'canceled') status = 'cancelled';
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    status = 'incomplete';
  }

  // Cast subscription to access period timestamps (newer Stripe API types)
  const subAny = subscription as unknown as { 
    current_period_start: number; 
    current_period_end: number;
  };

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier,
      status,
      user_limit: userLimit,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: new Date(subAny.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subAny.current_period_end * 1000).toISOString(),
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', targetOrgId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Updated subscription for org ${targetOrgId}: ${tier} (${status})`);
  }
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const { data } = await supabase
    .from('subscriptions')
    .select('org_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  const sub = data as SubscriptionRow | null;
  if (!sub) {
    console.error('Could not find subscription:', subscription.id);
    return;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'cancelled',
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', sub.org_id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  } else {
    console.log(`Cancelled subscription for org ${sub.org_id}`);
  }
}

async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  // Get subscription ID - handle both string and object cases
  const rawSubscription = (invoice as { subscription?: string | { id: string } | null }).subscription;
  const subscriptionId = typeof rawSubscription === 'string' 
    ? rawSubscription 
    : rawSubscription?.id;
  if (!subscriptionId) return;

  const { data } = await supabase
    .from('subscriptions')
    .select('org_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  const sub = data as SubscriptionRow | null;
  if (!sub) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', sub.org_id);

  console.log(`Payment failed for org ${sub.org_id}`);
}

async function handlePaymentSucceeded(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  // Get subscription ID - handle both string and object cases
  const rawSubscription = (invoice as { subscription?: string | { id: string } | null }).subscription;
  const subscriptionId = typeof rawSubscription === 'string' 
    ? rawSubscription 
    : rawSubscription?.id;
  if (!subscriptionId) return;

  const { data } = await supabase
    .from('subscriptions')
    .select('org_id, status')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  const sub = data as SubscriptionRow | null;
  if (!sub) return;

  if (sub.status === 'past_due') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', sub.org_id);

    console.log(`Payment succeeded, reactivated org ${sub.org_id}`);
  }
}
