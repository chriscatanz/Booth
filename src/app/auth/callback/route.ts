import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route - handles email confirmation redirects from Supabase
 * 
 * Flow:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to /auth/callback?code=...
 * 3. This route exchanges the code for a session
 * 4. Redirects user to the app (or shows error)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/';
  
  // Handle errors from Supabase
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription);
    const errorUrl = new URL('/', requestUrl.origin);
    errorUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }
  
  // If no code, redirect to home
  if (!code) {
    console.warn('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }
  
  try {
    // Create a Supabase client for the callback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError);
      const errorUrl = new URL('/', requestUrl.origin);
      errorUrl.searchParams.set('auth_error', exchangeError.message);
      return NextResponse.redirect(errorUrl);
    }
    
    console.log('[Auth Callback] Session established for:', data.user?.email);
    
    // Set the session cookies and redirect to app
    // The session will be picked up by the client-side Supabase client
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set('auth_confirmed', 'true');
    
    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);
    
    // Set session tokens as cookies (httpOnly for security)
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    
    return response;
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err);
    const errorUrl = new URL('/', requestUrl.origin);
    errorUrl.searchParams.set('auth_error', 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}
