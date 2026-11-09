'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkspaceLogo } from '@/components/workspace/workspace-logo';
import { firstImageFile } from '@/helper/utils/image-file';

interface WorkspaceLogoFieldProps {
  name: string;
  logo: string | null;
  onPick: (file: File | null) => void;
  onRemove: () => void;
  disabled: boolean;
}

/** The logo, with upload and remove; the first letter stands in without one. */
export const WorkspaceLogoField = ({
  name,
  logo,
  onPick,
  onRemove,
  disabled,
}: WorkspaceLogoFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-medium text-ink">Logo</span>
      <div className="flex flex-wrap items-center gap-4">
        {logo ? (
          <WorkspaceLogo
            workspace={{ name, logo }}
            size="size-16"
            rounded="rounded-xl"
            textSize="text-2xl"
          />
        ) : (
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-label="Upload a logo"
            className="size-16 rounded-xl border-dashed border-line-strong text-ink-subtle hover:border-ink-faint"
          >
            <Upload className="size-4.5" />
          </Button>
        )}
        <span className="flex min-w-0 flex-1 basis-60 flex-col gap-2">
          <span className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {logo ? 'Upload new' : 'Upload logo'}
            </Button>
            {logo && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={onRemove}
              >
                Remove
              </Button>
            )}
          </span>
          <span className="text-xs leading-4.25 text-ink-subtle">
            PNG, JPG or SVG, square works best. Shows next to the workspace name
            in the header. Without one, the first letter is used.
          </span>
        </span>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            onPick(firstImageFile(e.target.files));
            e.target.value = '';
          }}
          className="sr-only"
        />
      </div>
    </div>
  );
};
