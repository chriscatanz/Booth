import { NextResponse } from 'next/server';

// Stripe checkout - disabled until Stripe is configured
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe checkout not yet configured' },
    { status: 503 }
  );
}
