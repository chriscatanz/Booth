import { NextResponse } from 'next/server';

// Stripe billing portal - disabled until Stripe is configured
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe billing not yet configured' },
    { status: 503 }
  );
}
