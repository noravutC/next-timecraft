import * as React from "react";

import { cn } from "@/lib/utils";

type LoaderSize = "xs" | "sm" | "md" | "lg";

// bar height / width / gap (px) per size — the TimeCraft signature wave loader
const SIZE_MAP: Record<LoaderSize, { h: number; w: number; g: number }> = {
  xs: { h: 15, w: 3.5, g: 3 },
  sm: { h: 18, w: 4, g: 3 },
  md: { h: 30, w: 6, g: 5 },
  lg: { h: 44, w: 9, g: 7 },
};

interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: LoaderSize;
  /** Render white bars for use on a colored / dark background (e.g. inside a brand button). */
  onColor?: boolean;
}

/**
 * Standard app loader — three brand bars rising in a staggered wave.
 * Use everywhere a loading indicator is needed (inline, in buttons, full screen via {@link LoaderScreen}).
 */
export function Loader({
  size = "md",
  onColor = false,
  className,
  style,
  ...props
}: LoaderProps) {
  const { h, w, g } = SIZE_MAP[size];

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("tc-load", className)}
      style={
        {
          "--tc-h": `${h}px`,
          "--tc-w": `${w}px`,
          "--tc-g": `${g}px`,
          ...(onColor ? { "--tc-bar": "#fff" } : {}),
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <i />
      <i />
      <i />
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
 * Full-screen branded loader for route/page level loading states (app entry,
 * post-login). Brand-gradient backdrop, a glass tile with a pulsing ring around
 * the wave mark, and a sweeping track bar — the standard app-loading screen.
 */
export function LoaderScreen({ title, label, className }: LoaderScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-7 p-10",
        className,
      )}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 30%, color-mix(in oklab, var(--brand), white 12%), color-mix(in oklab, var(--brand), black 52%))",
      }}
    >
      {/* mark in a glass tile with a pulsing ring */}
      <div className="relative size-24">
        <div className="tc-ring rounded-3xl" />
        <div className="relative grid size-24 place-items-center rounded-3xl bg-white shadow-2xl shadow-indigo-950/50">
          <Loader size="lg" />
        </div>
      </div>

      {(title || label) && (
        <div className="text-center">
          {title ? (
            <div className="text-lg font-bold tracking-tight text-white">
              {title}
            </div>
          ) : null}
          {label ? (
            <div className="mt-1.5 text-sm text-white/70">{label}</div>
          ) : null}
        </div>
      )}

      {/* sweeping track bar */}
      <div
        className="tc-track h-1 w-45 rounded-full"
        style={
          {
            "--tc-bar": "#fff",
            background: "rgba(255,255,255,.22)",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
