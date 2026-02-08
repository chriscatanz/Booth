import type { NextConfig } from "next";

// Use static export only for Tauri builds, not for Vercel
const isTauriBuild = process.env.TAURI_BUILD === 'true';

const nextConfig: NextConfig = {
  // Static export only for Tauri desktop builds
  // Vercel handles dynamic routes fine
  ...(isTauriBuild ? { output: 'export' } : {}),
  
  // Disable image optimization for Tauri (not needed for Vercel)
  images: {
    unoptimized: isTauriBuild,
  },
  
  // Trailing slashes only needed for static file serving
  ...(isTauriBuild ? { trailingSlash: true } : {}),
};

export default nextConfig;
