import { NextResponse, type NextRequest } from 'next/server';
import { buildContentSecurityPolicy, createNonce } from '@/lib/security/csp';

// Per-request CSP nonce. Next.js reads the nonce from the request's CSP
// header and puts it on every script it renders, so only those scripts run.
// Pages render dynamically for this (see `dynamic` in app/layout.tsx).
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === 'development',
  );

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // pages only: API routes, static files and images need no CSP
      source: '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
