import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getPriceIds() {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { orgId, tier, successUrl, cancelUrl } = await request.json();

    if (!orgId || !tier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const PRICE_IDS = getPriceIds();
    if (!PRICE_IDS[tier as keyof typeof PRICE_IDS]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripe();

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

    // Get org owner email from organization_members
    const { data: ownerMember, error: ownerError } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .single();

    if (ownerError || !ownerMember) {
      return NextResponse.json(
        { error: 'Organization owner not found' },
        { status: 404 }
      );
    }

    // Get owner's email from user_profiles
    const { data: owner } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', ownerMember.user_id)
      .single();

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
          price: PRICE_IDS[tier as keyof typeof PRICE_IDS],
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
