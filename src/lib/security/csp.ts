// Every origin the browser talks to. Anything else (injected scripts,
// tracking images in markdown, exfiltration via fetch) is blocked.
const PUSHER = 'https://*.pusher.com wss://*.pusher.com';
const SUPABASE = 'https://*.supabase.co'; // comment attachments: upload + view
const GOOGLE_AVATARS = 'https://*.googleusercontent.com';
const SENTRY = 'https://*.sentry.io';

/**
 * Content-Security-Policy for one response. Scripts run only with this
 * request's nonce ('strict-dynamic' lets those scripts load Next's chunks),
 * so an injected inline script is blocked. Styles stay 'unsafe-inline':
 * React style attributes (board colors, drag transforms) need it.
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    // dev also needs eval: React rebuilds server error stacks with it
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${SUPABASE} ${GOOGLE_AVATARS}`,
    `media-src 'self' blob: ${SUPABASE}`,
    "font-src 'self' data:",
    `connect-src 'self' ${PUSHER} ${SUPABASE} ${SENTRY}${isDev ? ' ws://localhost:*' : ''}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
  ].join('; ');
}

/** 128 random bits, base64: unguessable per request. */
export const createNonce = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
