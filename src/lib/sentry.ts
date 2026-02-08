/**
 * Sentry Error Monitoring Setup
 * 
 * To enable:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to your .env.local
 * 
 * This file provides a lightweight wrapper that gracefully
 * handles missing Sentry configuration.
 */

// Check if Sentry is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SENTRY_ENABLED = !!SENTRY_DSN && IS_PRODUCTION;

// Lazy-load Sentry only if configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

async function loadSentry() {
  if (!SENTRY_ENABLED) return null;
  
  try {
    Sentry = await import('@sentry/nextjs');
    return Sentry;
  } catch {
    console.warn('Sentry not installed. Run: npm install @sentry/nextjs');
    return null;
  }
}

// Initialize Sentry (call this in your app)
export async function initSentry() {
  const sentry = await loadSentry();
  if (!sentry || !SENTRY_DSN) return;

  sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Only report errors in production
    enabled: IS_PRODUCTION,
    
    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'fb_xd_fragment',
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User-caused
      'ResizeObserver loop',
    ],
    
    // Add context
    beforeSend(event) {
      // Don't send events in development
      if (!IS_PRODUCTION) return null;
      return event;
    },
  });
}

// Capture an exception
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_ENABLED) {
    console.error('Error:', error, context);
    return;
  }

  loadSentry().then(sentry => {
    if (sentry) {
      sentry.captureException(error, { extra: context });
    }
  });
}

// Capture a message
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_ENABLED) {
    console.log(`[${level}]`, message);
    return;
  }

  loadSentry().then(sentry => {
    if (sentry) {
      sentry.captureMessage(message, level);
    }
  });
}

// Set user context
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (!SENTRY_ENABLED) return;

  loadSentry().then(sentry => {
    if (sentry) {
      sentry.setUser(user);
    }
  });
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}) {
  if (!SENTRY_ENABLED) return;

  loadSentry().then(sentry => {
    if (sentry) {
      sentry.addBreadcrumb(breadcrumb);
    }
  });
}

// Wrap an async function with error capture
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, { ...context, args });
      throw error;
    }
  }) as T;
}
