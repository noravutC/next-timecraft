import { BadRequestError } from './errors';

// Route segments go straight into `uuid` columns; a malformed value would
// otherwise surface as a Postgres error (500) instead of a 400.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MAX_IDS_PER_REQUEST = 100;

export const isUuid = (value: string) => UUID_PATTERN.test(value);

/** One uuid route segment. Throws 400 when malformed. */
export function parseId(raw: string): string {
  const id = raw.trim();
  if (!isUuid(id)) throw new BadRequestError('Invalid id');
  return id;
}

/** Comma-separated uuid route segment → unique ids. Throws 400 when empty, malformed or too many. */
export function parseIdList(raw: string, max = MAX_IDS_PER_REQUEST): string[] {
  const ids = [
    ...new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
  if (ids.length === 0) throw new BadRequestError('ids are required');
  if (ids.length > max) {
    throw new BadRequestError(`At most ${max} ids per request`);
  }
  if (!ids.every(isUuid)) throw new BadRequestError('Invalid id');
  return ids;
}
