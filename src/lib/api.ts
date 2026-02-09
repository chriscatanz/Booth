import { supabase } from './supabase';

/**
 * Make an authenticated API request with the current user's Supabase session token.
 * Falls back to unauthenticated request if no session exists.
 * 
 * Note: For FormData bodies, don't set Content-Type - let the browser handle it.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if body is FormData (don't set Content-Type for FormData)
  const isFormData = options.body instanceof FormData;
  
  // Build headers with auth token if available
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  
  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
