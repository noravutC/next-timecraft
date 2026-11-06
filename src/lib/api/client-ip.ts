/**
 * Client IP as seen by our reverse proxy. Caddy overwrites X-Forwarded-For
 * for untrusted clients, and the last hop is the one our own proxy added,
 * so a client can't pick its own value.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'unknown';
}
