/** First image in a drop or file-picker selection, or null when there is none. */
export const firstImageFile = (
  files: ArrayLike<File> | null | undefined,
): File | null =>
  Array.from(files ?? []).find((file) => file.type.startsWith('image/')) ??
  null;

/** The centered square to crop from a width×height image to fill a square. */
export const centerSquare = (width: number, height: number) => {
  const side = Math.min(width, height);
  return { x: (width - side) / 2, y: (height - side) / 2, side };
};

/**
 * Draws an image file (PNG, JPEG, WebP, GIF or SVG) into a size×size square,
 * center-cropped, as a WebP data URL (PNG where the browser can't encode
 * WebP). Rejects when the browser can't decode the file.
 */
export async function squareImageDataUrl(
  file: File,
  size: number,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');
    if (image.naturalWidth && image.naturalHeight) {
      const crop = centerSquare(image.naturalWidth, image.naturalHeight);
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.side,
        crop.side,
        0,
        0,
        size,
        size,
      );
    } else {
      // an SVG without width and height has no natural size: fill the square
      context.drawImage(image, 0, 0, size, size);
    }
    return canvas.toDataURL('image/webp', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}
