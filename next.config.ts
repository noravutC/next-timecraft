import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Every origin the browser talks to. Anything else (injected scripts,
// tracking images in markdown, exfiltration via fetch) is blocked.
const PUSHER = "https://*.pusher.com wss://*.pusher.com";
const SUPABASE = "https://*.supabase.co"; // comment attachments: upload + view
const GOOGLE_AVATARS = "https://*.googleusercontent.com";
const SENTRY = "https://*.sentry.io";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; dev also needs eval for HMR
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE} ${GOOGLE_AVATARS}`,
  `media-src 'self' blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${PUSHER} ${SUPABASE} ${SENTRY}${isDev ? " ws://localhost:*" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
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
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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

export default nextConfig;
