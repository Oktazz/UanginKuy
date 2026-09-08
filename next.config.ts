import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices and ngrok tunnels to access the dev server
  allowedDevOrigins: [
    '192.168.0.125',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
  ],

  // pdf-parse v2 depends on pdfjs-dist which loads a web worker file
  // (pdf.worker.mjs). The Next.js server bundler cannot resolve this worker,
  // so we let Node.js require these packages directly from node_modules.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  async redirects() {
    return [
      {
        source: '/profile/addreses',
        destination: '/profile/addresses',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://pcqzoqqmrxarhjeduijo.supabase.co wss://pcqzoqqmrxarhjeduijo.supabase.co https://api.opencagedata.com https://api.mapbox.com https://events.mapbox.com https://tiles.openfreemap.org",
              "worker-src 'self' blob:",
              "frame-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join(' ').replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
