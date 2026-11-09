import { describe, expect, it } from 'vitest';
import {
  ATTACH_ANY_ACCEPT,
  classifyMime,
  fileBadge,
  formatFileSize,
  maxBytesFor,
  splitAttachments,
} from './attachment-kinds';

describe('classifyMime', () => {
  it('sorts uploads into image, video and file', () => {
    expect(classifyMime('image/png')).toBe('image');
    expect(classifyMime('video/mp4')).toBe('video');
    expect(classifyMime('application/pdf')).toBe('file');
    expect(
      classifyMime(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('file');
  });

  it('refuses types a browser would run or render as a page', () => {
    expect(classifyMime('text/html')).toBeNull();
    expect(classifyMime('image/svg+xml')).toBeNull();
    expect(classifyMime('application/javascript')).toBeNull();
    expect(classifyMime('')).toBeNull();
  });

  it('caps documents at 10 MB', () => {
    expect(maxBytesFor('file')).toBe(10 * 1024 * 1024);
  });

  it('lets the any-file picker offer every accepted type', () => {
    expect(ATTACH_ANY_ACCEPT).toContain('application/pdf');
    expect(ATTACH_ANY_ACCEPT).toContain('image/png');
  });
});

describe('fileBadge and formatFileSize', () => {
  it('labels common documents', () => {
    expect(fileBadge('application/pdf')).toBe('PDF');
    expect(fileBadge('application/vnd.ms-excel')).toBe('XLS');
    expect(fileBadge('application/zip')).toBe('ZIP');
    expect(fileBadge('application/x-unknown')).toBe('FILE');
  });

  it('reads sizes in KB and MB', () => {
    expect(formatFileSize(253_952)).toBe('248 KB');
    expect(formatFileSize(1_258_291)).toBe('1.2 MB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
    expect(formatFileSize(10)).toBe('1 KB');
  });
});

describe('splitAttachments', () => {
  it('keeps media and documents apart, in order', () => {
    const items = [
      { id: 'a', type: 'image' as const },
      { id: 'b', type: 'file' as const },
      { id: 'c', type: 'video' as const },
    ];
    const { media, files } = splitAttachments(items);
    expect(media.map((a) => a.id)).toEqual(['a', 'c']);
    expect(files.map((a) => a.id)).toEqual(['b']);
  });
});
