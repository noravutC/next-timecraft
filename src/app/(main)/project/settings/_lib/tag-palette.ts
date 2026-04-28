import { TAG_PALETTE, type TagPalette } from './constants';

export const paletteFor = (color: string): TagPalette =>
  TAG_PALETTE.find((p) => p.value === color) ?? TAG_PALETTE[0];

export const hashTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length].value;
};
