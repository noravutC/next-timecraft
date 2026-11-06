'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { squareImageDataUrl } from '@/helper/utils/image-file';

// shown at 64px at most, so 128px stays sharp on 2x screens
const LOGO_SIZE = 128;

/** A logo picked from a file, resized to a small square data URL. */
export function useWorkspaceLogoPicker(initial: string | null = null) {
  const [logo, setLogo] = useState<string | null>(initial);

  const pick = async (file: File | null) => {
    if (!file) return;
    try {
      setLogo(await squareImageDataUrl(file, LOGO_SIZE));
    } catch {
      toast.error('Couldn’t read that image. Try a PNG, JPG or SVG.');
    }
  };

  return { logo, pick, clear: () => setLogo(null) };
}
