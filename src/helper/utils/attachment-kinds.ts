/**
 * What may be attached to a comment. The single source for the upload URL
 * route, the comment route, the storage bucket's allowlist and the composer.
 */

export type AttachmentKind = 'image' | 'video' | 'file';

export const ALLOWED_IMAGE_MIME: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export const ALLOWED_VIDEO_MIME: ReadonlySet<string> = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

// Documents people share on tasks. Nothing the browser would run or render
// as a page (no HTML, SVG or scripts): the bucket serves files publicly.
export const ALLOWED_FILE_MIME: ReadonlySet<string> = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_COMMENT = 10;

export const classifyMime = (mime: string): AttachmentKind | null => {
  if (ALLOWED_IMAGE_MIME.has(mime)) return 'image';
  if (ALLOWED_VIDEO_MIME.has(mime)) return 'video';
  if (ALLOWED_FILE_MIME.has(mime)) return 'file';
  return null;
};

export const maxBytesFor = (kind: AttachmentKind): number =>
  kind === 'image'
    ? MAX_IMAGE_BYTES
    : kind === 'video'
      ? MAX_VIDEO_BYTES
      : MAX_FILE_BYTES;

/** Everything the bucket accepts, for its allowlist. */
export const ALL_ALLOWED_MIME: readonly string[] = [
  ...ALLOWED_IMAGE_MIME,
  ...ALLOWED_VIDEO_MIME,
  ...ALLOWED_FILE_MIME,
];

/** `accept` values for the composer's Image, Video and "Attach file" pickers. */
export const IMAGE_ACCEPT = [...ALLOWED_IMAGE_MIME].join(',');
export const VIDEO_ACCEPT = [...ALLOWED_VIDEO_MIME].join(',');
export const ATTACH_ANY_ACCEPT = ALL_ALLOWED_MIME.join(',');

const BADGES: [RegExp, string][] = [
  [/pdf$/, 'PDF'],
  [/(msword|wordprocessingml|opendocument\.text)/, 'DOC'],
  [/(ms-excel|spreadsheetml|opendocument\.spreadsheet)/, 'XLS'],
  [/(ms-powerpoint|presentationml|opendocument\.presentation)/, 'PPT'],
  [/zip/, 'ZIP'],
  [/csv$/, 'CSV'],
  [/json$/, 'JSON'],
  [/markdown$/, 'MD'],
  [/plain$/, 'TXT'],
];

/** Short type badge for a file chip: PDF, DOC, XLS, ZIP… */
export const fileBadge = (mime: string): string =>
  BADGES.find(([pattern]) => pattern.test(mime))?.[1] ?? 'FILE';

/** "248 KB", "1.2 MB" */
export const formatFileSize = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB`;

/** Images and videos show as previews; documents as file chips below them. */
export const splitAttachments = <T extends { type: AttachmentKind }>(
  attachments: T[],
): { media: T[]; files: T[] } => ({
  media: attachments.filter((a) => a.type !== 'file'),
  files: attachments.filter((a) => a.type === 'file'),
});
