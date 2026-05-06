export function hexToRgba(hex: string, alpha: number): string {
  // Remove the # if present
  let c = hex.replace("#", "");

  if (c.length === 3) {
    c = c
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Parse the r, g, b values
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // Return the rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
