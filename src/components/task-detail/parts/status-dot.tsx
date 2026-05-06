interface StatusDotProps {
  color?: string;
}

export const StatusDot = ({ color }: StatusDotProps) => (
  <span
    className="inline-block size-2.5 rounded-full"
    style={{ backgroundColor: color ?? "#94a3b8" }}
  />
);
