// Collapse id-like path segments: `/api/task/<id>` and `/api/task/<other id>`
// share one rate-limit bucket, and logs never carry ids or invite tokens.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ID_SEGMENT = new RegExp(
  `^(?:${UUID})(?:,(?:${UUID}))*,?$|^[\\w-]{24,}$`,
  'i',
);

export function toRouteKey(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // malformed escape: keep the raw path
  }
  return decoded
    .toLowerCase()
    .split('/')
    .filter(Boolean)
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
}
