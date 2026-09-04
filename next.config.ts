import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices (phones, tablets) to access the dev server
  // Add your device's local IP here if it changes
  allowedDevOrigins: [
    '192.168.0.125',
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
};

export default nextConfig;
