'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const MAX_BOARD_COVER_SIZE = 2 * 1024 * 1024;
export const BOARD_COVER_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

/** Optional board image picked on the first-board page (stored as a data URL). */
export function useBoardCover() {
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!BOARD_COVER_TYPES.includes(file.type)) {
      toast.error('Please upload JPG, PNG, WEBP, GIF, or AVIF.');
      return;
    }
    if (file.size > MAX_BOARD_COVER_SIZE) {
      toast.error('Board image must be 2MB or less.');
      return;
    }
    try {
      setCoverImage(await fileToDataUrl(file));
    } catch {
      toast.error('Unable to read the selected image.');
    }
  };

  return { coverImage, pickFile, clear: () => setCoverImage(null) };
}
