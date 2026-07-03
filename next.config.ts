import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import pkg from "./package.json";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Avoid stale production SW intercepting dev chunks (ChunkLoadError)
  register: process.env.NODE_ENV === "production",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    importScripts: ["/push-handler.js"],
  },
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? pkg.version,
  },
  // Set via npm run dev — keeps dev cache outside iCloud Drive (see package.json).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  // Allow 127.0.0.1 in dev (portal links often use it; Next 16 blocks cross-origin dev assets otherwise)
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Hides the floating Next.js "N" badge in development (still shows on errors)
  devIndicators: false,
  serverExternalPackages: ['@react-pdf/renderer'],
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
      {
        source: '/book/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
    ];
  },
};

export default withPWA(nextConfig);
