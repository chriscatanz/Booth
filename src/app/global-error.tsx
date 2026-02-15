'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  // Note: global-error.tsx replaces the entire HTML, so we need inline styles
  // or must include basic styling without the app's CSS
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0D1117',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#E6EDF3',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '24px',
        }}>
          {/* Error Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(248, 81, 73, 0.15)',
            marginBottom: '24px',
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#F85149" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#E6EDF3',
          }}>
            Critical Error
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B949E',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}>
            A critical error occurred and the application could not recover. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{
              fontSize: '12px',
              color: '#6E7681',
              marginBottom: '24px',
            }}>
              Error ID: {error.digest}
            </p>
          )}

          {/* Retry Button */}
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(to right, #A62B9F, #7A1F75)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(166, 43, 159, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
