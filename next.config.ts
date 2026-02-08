import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Tauri desktop builds
  output: 'export',
  
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
  
  // Ensure trailing slashes for static file serving
  trailingSlash: true,
};

export default nextConfig;
