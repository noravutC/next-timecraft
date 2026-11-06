import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the UI kit's named tokens (globals.css @theme) so an
// override like cn("shadow-card", "shadow-none") replaces instead of stacking.
// Font sizes (4xs … md) already parse as t-shirt sizes.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: [
        "card",
        "card-hover",
        "card-drag",
        "segment",
        "knob",
        "popover",
        "toast",
        "sheet",
        "dialog",
      ],
      radius: ["popover"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
