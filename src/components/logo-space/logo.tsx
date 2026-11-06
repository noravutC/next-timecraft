import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

type LogoTextSize = "xs" | "sm" | "base" | "md" | "lg" | "xl";

const TEXT_SIZE: Record<LogoTextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
};

interface LogoProps {
  size?: number;
  textSize?: LogoTextSize;
}
export const Logo = ({ size = 25, textSize = "base" }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} className="shrink-0" />
      <p
        className={cn(
          "font-semibold tracking-tight text-ink",
          TEXT_SIZE[textSize],
        )}
      >
        TimeCraft
      </p>
    </div>
  );
};
