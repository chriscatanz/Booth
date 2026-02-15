import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Booth - Trade Show Management Software';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -75,
            left: -75,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.1)',
          }}
        />

        {/* Logo and title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Logo icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 900,
              }}
            >
              B
            </span>
          </div>
          <span
            style={{
              color: 'white',
              fontSize: 64,
              fontWeight: 700,
            }}
          >
            Booth
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: 'white',
            fontSize: 40,
            fontWeight: 600,
            marginTop: 48,
          }}
        >
          Trade Show Management Software
        </div>

        {/* Description */}
        <div
          style={{
            color: '#8B949E',
            fontSize: 26,
            marginTop: 32,
            lineHeight: 1.5,
            maxWidth: 900,
          }}
        >
          Track shows, manage budgets, coordinate teams, and measure ROI — all in one place.
        </div>

        {/* URL */}
        <div
          style={{
            color: '#8B5CF6',
            fontSize: 24,
            fontWeight: 500,
            marginTop: 'auto',
          }}
        >
          getbooth.io
        </div>

        {/* Accent bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 20,
            background: 'linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
