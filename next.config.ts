import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices (phones, tablets) to access the dev server
  // Add your device's local IP here if it changes
  allowedDevOrigins: [
    '192.168.0.125',
  ],
};

export default nextConfig;
