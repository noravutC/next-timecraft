'use client';

import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HiddenFileInput } from '@/components/task-detail/parts/hidden-file-input';
import { BOARD_COVER_TYPES } from './use-board-cover';

/** Optional image for the board tile, under the name field. */
export const BoardCoverField = ({
  coverImage,
  onPick,
  onClear,
}: {
  coverImage: string | null;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2.5">
      <HiddenFileInput
        ref={inputRef}
        accept={BOARD_COVER_TYPES.join(',')}
        onFiles={(files) => onPick(files[0])}
      />
      {coverImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img
            src={coverImage}
            alt="Board image preview"
            className="size-8 rounded-md border border-line object-cover"
          />
          <span className="text-sm text-ink-muted">Board image added</span>
          <Button variant="ghost" size="xs" onClick={onClear}>
            Remove
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => inputRef.current?.click()}
          className="-ml-2 font-normal text-ink-subtle"
        >
          <ImagePlus className="size-3.5" />
          Add a board image (optional)
        </Button>
      )}
    </div>
  );
};
