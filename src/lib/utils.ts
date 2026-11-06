import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the UI kit's named tokens (globals.css @theme) so an
// override like cn("shadow-card", "shadow-none") replaces instead of stacking.
// T-shirt font sizes (4xs … 3xl) parse on their own; the role sizes below
// would otherwise read as colors and knock out the text color next to them.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "copy",
        "lead",
        "title-sm",
        "title",
        "price",
        "heading-sm",
        "heading",
        "cta-sm",
        "cta",
        "display-sm",
        "display",
      ],
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
