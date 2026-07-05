interface LogoProps {
  size?: number;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
}
export const Logo = ({ size = 25, textSize = "base" }: LogoProps) => {
  const iconSize = Math.round(size * 0.53);
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex shrink-0 items-center justify-center rounded-[9px] shadow-[0_2px_6px_rgba(91,80,230,0.3)]"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg,#6C5CE7,#4A3FD6)",
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="12" width="3.4" height="8" rx="1.2" fill="#fff" />
          <rect x="10.3" y="6" width="3.4" height="14" rx="1.2" fill="#fff" />
          <rect x="16.6" y="9" width="3.4" height="11" rx="1.2" fill="#fff" />
        </svg>
      </div>
      <p
        className={`font-extrabold tracking-tight text-ink ${textSize === "xs" ? "text-xs" : textSize === "sm" ? "text-sm" : textSize === "base" ? "text-base" : textSize === "lg" ? "text-lg" : "text-xl"}`}
      >
        TimeCraft
      </p>
    </div>
  );
};
