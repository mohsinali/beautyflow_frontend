import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    "easing-spoilage-footer.ngrok-free.dev",
  ]
};

export default nextConfig;
