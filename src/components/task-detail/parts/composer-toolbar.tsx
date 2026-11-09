import {
  Image as ImageIcon,
  Paperclip,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { modKeyLabel } from '@/lib/platform';

type Props = {
  preview: boolean;
  canSend: boolean;
  onTogglePreview: () => void;
  onSend: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onPickAny: () => void;
};

const AttachButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    aria-label={label}
    className="size-7.5 text-ink-subtle"
  >
    <Icon />
  </Button>
);

export const ComposerToolbar = ({
  preview,
  canSend,
  onTogglePreview,
  onSend,
  onPickImage,
  onPickVideo,
  onPickAny,
}: Props) => (
  <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-2">
    <AttachButton icon={ImageIcon} label="Attach image" onClick={onPickImage} />
    <AttachButton icon={Video} label="Attach video" onClick={onPickVideo} />
    <AttachButton icon={Paperclip} label="Attach file" onClick={onPickAny} />
    <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />
    <Button
      variant="ghost"
      size="xs"
      onClick={onTogglePreview}
      aria-pressed={preview}
      className="h-7.5 px-2"
    >
      {preview ? 'Edit' : 'Preview'}
    </Button>
    <div className="flex-1" />
    <span className="mr-2 font-mono text-2xs text-ink-subtle">
      {modKeyLabel()} ↵
    </span>
    <Button size="sm" onClick={onSend} disabled={!canSend} className="h-7.5">
      Comment
    </Button>
  </div>
);
