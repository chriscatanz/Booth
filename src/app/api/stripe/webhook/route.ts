import { NextResponse } from 'next/server';

// Stripe webhook - disabled until Stripe is configured
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe webhook not yet configured' },
    { status: 503 }
  );
}
