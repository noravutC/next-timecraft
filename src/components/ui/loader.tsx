import * as React from "react";

import { cn } from "@/lib/utils";
import { LogoLoading } from "@/components/logo-space/logo-loading";

type LoaderSize = "xs" | "sm" | "md" | "lg";

// rendered logo size (px) per loader size
const SIZE_MAP: Record<LoaderSize, number> = {
  xs: 16,
  sm: 20,
  md: 32,
  lg: 48,
};

interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: LoaderSize;
  /** Render a white mark for use on a colored / dark background (e.g. inside a primary button). */
  onColor?: boolean;
}

/**
 * Standard app loader — the TimeCraft mark drawing itself in a loop.
 * Use everywhere a loading indicator is needed (inline, in buttons, full screen via {@link LoaderScreen}).
 */
export function Loader({
  size = "md",
  onColor = false,
  className,
  ...props
}: LoaderProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex shrink-0", className)}
      {...props}
    >
      <LogoLoading
        size={SIZE_MAP[size]}
        color={onColor ? "#ffffff" : undefined}
      />
    </span>
  );
}

interface LoaderScreenProps {
  /** Main heading under the mark. */
  title?: string;
  /** Secondary line under the title. */
  label?: string;
  className?: string;
}

/**
 * Full-screen loader for route/page level loading states (app entry,
 * post-login): the animated logo mark centred on a plain background.
 */
export function LoaderScreen({ title, label, className }: LoaderScreenProps) {
  return (
    <div
      role="status"
      aria-label={title ?? "Loading"}
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-10",
        className,
      )}
    >
      <LogoLoading size={56} />

      {(title || label) && (
        <div className="text-center">
          {title ? (
            <div className="text-lg font-semibold tracking-tight text-ink">
              {title}
            </div>
          ) : null}
          {label ? (
            <div className="mt-1 text-sm text-ink-muted">{label}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
