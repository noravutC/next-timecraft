import { Eye, Image as ImageIcon, Paperclip, Pencil, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  preview: boolean;
  canSend: boolean;
  onTogglePreview: () => void;
  onSend: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onPickAny: () => void;
};

export const ComposerToolbar = ({
  preview,
  canSend,
  onTogglePreview,
  onSend,
  onPickImage,
  onPickVideo,
  onPickAny,
}: Props) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          variant="ghost"
          title="Attach image"
          onClick={onPickImage}
          className="p-1"
          size={null}
        >
          <ImageIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          title="Attach video"
          onClick={onPickVideo}
          className="p-1"
          size={null}
        >
          <Video className="size-4" />
        </Button>
        <Button
          variant="ghost"
          title="Attach file"
          onClick={onPickAny}
          className="p-1"
          size={null}
        >
          <Paperclip className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size={null}
          onClick={onTogglePreview}
          className="gap-1 p-1 text-xs"
          title={preview ? "Edit" : "Preview"}
        >
          {preview ? (
            <>
              <Pencil className="size-3.5" /> Edit
            </>
          ) : (
            <>
              <Eye className="size-3.5" /> Preview
            </>
          )}
        </Button>
        <Button
          size="xs"
          onClick={onSend}
          disabled={!canSend}
          className="gap-2 text-xs"
        >
          <Send className="size-3" />
          Send
        </Button>
      </div>
    </div>
  );
};
