"use client";

import * as React from "react";
import { AlertTriangle, Bell, CheckCircle2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant =
  | "destructive"
  | "warning"
  | "info"
  | "success";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ConfirmDialogVariant;
  title: string;
  description?: React.ReactNode;
  primaryLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Type-to-confirm: primary stays disabled until input matches this string. */
  confirmPhrase?: string;
  /** Optional left-aligned tertiary action (e.g. "Save as draft"). */
  tertiary?: { label: string; onClick: () => void };
  /** Show top-right close (X) button. */
  dismissible?: boolean;
  /** Disable primary while async work is in flight. */
  loading?: boolean;
}

const VARIANTS: Record<
  ConfirmDialogVariant,
  {
    Icon: React.ComponentType<{ className?: string }>;
    iconWrap: string;
    iconColor: string;
    primaryVariant: React.ComponentProps<typeof Button>["variant"];
  }
> = {
  destructive: {
    Icon: Trash2,
    iconWrap: "bg-red-50 border-red-100",
    iconColor: "text-red-500",
    primaryVariant: "destructive",
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-500",
    primaryVariant: "default",
  },
  info: {
    Icon: Bell,
    iconWrap: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-500",
    primaryVariant: "default",
  },
  success: {
    Icon: CheckCircle2,
    iconWrap: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-500",
    primaryVariant: "default",
  },
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  variant = "destructive",
  title,
  description,
  primaryLabel,
  cancelLabel = "Cancel",
  onConfirm,
  confirmPhrase,
  tertiary,
  dismissible = false,
  loading = false,
}: ConfirmDialogProps) => {
  const [phrase, setPhrase] = React.useState("");

  React.useEffect(() => {
    if (!open) setPhrase("");
  }, [open]);

  const config = VARIANTS[variant];
  const Icon = config.Icon;

  const phraseMatches =
    !confirmPhrase || phrase.trim() === confirmPhrase.trim();
  const primaryDisabled = loading || !phraseMatches;

  const handleConfirm = async () => {
    if (primaryDisabled) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={dismissible}
        className="max-w-md gap-0 p-5"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border",
              config.iconWrap,
            )}
          >
            <Icon className={cn("size-4", config.iconColor)} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <DialogTitle className="text-sm font-semibold leading-snug">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            )}

            {confirmPhrase && (
              <div className="mt-3 space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Type{" "}
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {confirmPhrase}
                  </span>{" "}
                  to confirm.
                </p>
                <Input
                  autoFocus
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder={confirmPhrase}
                  className="h-9"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div>
            {tertiary && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={tertiary.onClick}
                className="px-0 text-muted-foreground"
              >
                {tertiary.label}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={config.primaryVariant}
              size="sm"
              onClick={handleConfirm}
              disabled={primaryDisabled}
            >
              {primaryLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
