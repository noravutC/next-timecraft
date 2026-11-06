// TimeCraft mark geometry (256×256 viewBox): the "T" stroke plus the dash beside it.
// Shared with LogoLoading, which animates the same shapes.
export const LOGO_COLOR = '#5145CD';
export const LOGO_T_PATH =
  'M48 42h160c11 0 20 9 20 20s-9 20-20 20h-61v91c0 27-17 42-43 42H91c-11 0-20-9-20-20s9-20 20-20h10c4 0 6-2 6-6V82H48c-11 0-20-9-20-20s9-20 20-20Z';
export const LOGO_DASH = { x: 164, y: 109, width: 48, height: 24, rx: 12 };

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export const LogoMark = ({ size = 24, className }: LogoMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill={LOGO_COLOR}
    aria-hidden="true"
    className={className}
  >
    <path d={LOGO_T_PATH} />
    <rect {...LOGO_DASH} />
  </svg>
);
