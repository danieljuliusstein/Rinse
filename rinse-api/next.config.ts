import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { createRequire } from "node:module";
import path from "node:path";
import pkg from "./package.json";

// #region agent log
(() => {
  const requireFromConfig = createRequire(path.join(process.cwd(), "package.json"));
  const coreRoot = path.resolve(process.cwd(), "../packages/core");
  const resolveFromCore = (id: string) => {
    try {
      return { ok: true as const, path: requireFromConfig.resolve(id, { paths: [coreRoot] }) };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    }
  };
  const zod = resolveFromCore("zod");
  const phone = resolveFromCore("libphonenumber-js");
  // Visible in Vercel build logs for post-fix verification
  console.log("[debug-86d280] core-deps", { zodOk: zod.ok, phoneOk: phone.ok, coreRoot });
  fetch("http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "86d280" },
    body: JSON.stringify({
      sessionId: "86d280",
      runId: "post-fix",
      hypothesisId: "A",
      location: "rinse-api/next.config.ts:core-deps",
      message: "core dependency resolve from packages/core",
      data: { zodOk: zod.ok, phoneOk: phone.ok, zod, phone, coreRoot },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
})();
// #endregion

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
        // Enforcing — allows customer sites to iframe the widget (Report-Only frame-ancestors is stricter in middleware).
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
