import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// The Content-Security-Policy is set per request in src/proxy.ts (it needs
// a fresh nonce); these headers are the same for every response.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // invite links carry a token in the path: never send it to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // ignored over plain HTTP; enforced once the site is served via HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  poweredByHeader: false,
  // don't write AGENTS.md into the repo on `next dev`
  agentRules: false,
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // comment attachments (public bucket)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

// Source maps go to Sentry only when a build has SENTRY_AUTH_TOKEN (the
// Docker build on main). Every other build is the plain config, unchanged.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      telemetry: false,
      // uploaded, then removed: the maps are never served to browsers
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // a failed upload must not fail the deploy
      errorHandler: (error) =>
        console.warn("Sentry source map upload failed:", error.message),
    })
  : nextConfig;
