import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

type LogoTextSize = "xs" | "sm" | "base" | "md" | "copy" | "lg" | "xl";

const TEXT_SIZE: Record<LogoTextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  copy: "text-copy",
  lg: "text-lg",
  xl: "text-xl",
};

interface LogoProps {
  size?: number;
  textSize?: LogoTextSize;
  /** extra classes for the wordmark, e.g. hide it on narrow screens */
  textClassName?: string;
}
export const Logo = ({
  size = 25,
  textSize = "base",
  textClassName,
}: LogoProps) => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <LogoMark size={size} className="shrink-0" />
      <p
        className={cn(
          "font-semibold tracking-tight text-ink",
          TEXT_SIZE[textSize],
          textClassName,
        )}
      >
        TimeCraft
      </p>
    </div>
  );
};
