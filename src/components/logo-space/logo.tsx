import { LogoMark } from "./logo-mark";

interface LogoProps {
  size?: number;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
}
export const Logo = ({ size = 25, textSize = "base" }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} className="shrink-0" />
      <p
        className={`font-semibold tracking-tight text-ink ${textSize === "xs" ? "text-xs" : textSize === "sm" ? "text-sm" : textSize === "base" ? "text-base" : textSize === "lg" ? "text-lg" : "text-xl"}`}
      >
        TimeCraft
      </p>
    </div>
  );
};
