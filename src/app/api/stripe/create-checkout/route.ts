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

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const supabase = getSupabase();

    const { orgId, tier, successUrl, cancelUrl } = await request.json();

    if (!orgId || !tier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const priceId = tier === 'starter' 
      ? process.env.STRIPE_STARTER_PRICE_ID 
      : process.env.STRIPE_PRO_PRICE_ID;
      
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for tier: ${tier}` },
        { status: 503 }
      );
    }

    // Get org and subscription
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get existing subscription to check for Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      // Get owner email from v_user_profiles (decrypted)
      const { data: owner } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('role', 'owner')
        .single();

      let email: string | undefined;
      if (owner) {
        const { data: profile } = await supabase
          .from('v_user_profiles')
          .select('email')
          .eq('id', owner.user_id)
          .single();
        email = profile?.email;
      }

      const customer = await stripe.customers.create({
        email,
        name: org.name,
        metadata: {
          org_id: orgId,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('org_id', orgId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          org_id: orgId,
          tier,
        },
      },
      metadata: {
        org_id: orgId,
        tier,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
