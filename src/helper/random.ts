export const getRandomPastelHex = () => {
  const hue = Math.floor(Math.random() * 360);      // 0–360
  const saturation = 60 + Math.random() * 20;       // 60–80%
  const lightness = 80 + Math.random() * 10;        // 80–90%

  return hslToHex(hue, saturation, lightness);
};

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16).padStart(2, "0");
    return hex;
  };

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};
