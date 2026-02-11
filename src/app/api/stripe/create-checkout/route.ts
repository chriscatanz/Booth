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

// Price IDs from Stripe
const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const { orgId, tier, successUrl, cancelUrl } = await request.json();

    if (!orgId || !tier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!PRICE_IDS[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Get org and subscription info
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, organizations(name)')
      .eq('org_id', orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get org owner email
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .single();

    if (ownerError || !owner) {
      return NextResponse.json(
        { error: 'Organization owner not found' },
        { status: 404 }
      );
    }

    let customerId = subscription.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: owner.email,
        metadata: {
          org_id: orgId,
          org_name: (subscription.organizations as any)?.name || 'Unknown',
        },
      });
      customerId = customer.id;

      // Save customer ID to subscription
      await supabaseAdmin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('org_id', orgId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[tier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          org_id: orgId,
          tier: tier,
        },
      },
      metadata: {
        org_id: orgId,
        tier: tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
