import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs to tiers
const PRICE_TO_TIER: Record<string, 'starter' | 'pro'> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: 'starter',
  [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
};

// Tier limits
const TIER_LIMITS: Record<string, { userLimit: number | null; showLimit: number | null }> = {
  starter: { userLimit: 5, showLimit: null },
  pro: { userLimit: null, showLimit: null },
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.org_id;
  const tier = session.metadata?.tier as 'starter' | 'pro';

  if (!orgId) {
    console.error('No org_id in checkout session metadata');
    return;
  }

  console.log(`[Checkout Complete] Org: ${orgId}, Tier: ${tier}`);

  // Subscription will be updated via customer.subscription.created event
  // But we can update the customer ID here if needed
  if (session.customer) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.org_id;
  
  if (!orgId) {
    // Try to find org by customer ID
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('org_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();
    
    if (!sub) {
      console.error('Could not find org for subscription:', subscription.id);
      return;
    }
  }

  const targetOrgId = orgId || (await getOrgIdByCustomer(subscription.customer as string));
  if (!targetOrgId) return;

  // Get price ID and determine tier
  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || 'starter';
  const limits = TIER_LIMITS[tier];

  // Map Stripe status to our status
  let status: 'active' | 'past_due' | 'cancelled' | 'incomplete' = 'active';
  if (subscription.status === 'past_due') status = 'past_due';
  else if (subscription.status === 'canceled') status = 'cancelled';
  else if (subscription.status === 'incomplete') status = 'incomplete';

  console.log(`[Subscription Update] Org: ${targetOrgId}, Tier: ${tier}, Status: ${status}`);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      tier,
      status,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      user_limit: limits.userLimit,
      show_limit: limits.showLimit,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      trial_ends_at: null, // Clear trial when subscription starts
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', targetOrgId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const targetOrgId = subscription.metadata?.org_id || 
    (await getOrgIdByCustomer(subscription.customer as string));
  
  if (!targetOrgId) return;

  console.log(`[Subscription Deleted] Org: ${targetOrgId}`);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: 'cancelled',
      status: 'cancelled',
      user_limit: 0,
      show_limit: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', targetOrgId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const targetOrgId = await getOrgIdByCustomer(customerId);
  
  if (!targetOrgId) return;

  console.log(`[Payment Failed] Org: ${targetOrgId}`);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', targetOrgId);

  // TODO: Send email notification about failed payment
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const targetOrgId = await getOrgIdByCustomer(customerId);
  
  if (!targetOrgId) return;

  console.log(`[Payment Succeeded] Org: ${targetOrgId}`);

  // If was past_due, set back to active
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', targetOrgId)
    .eq('status', 'past_due');
}

async function getOrgIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .single();
  
  return data?.org_id || null;
}
