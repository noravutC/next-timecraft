/** First image in a drop or file-picker selection, or null when there is none. */
export const firstImageFile = (
  files: ArrayLike<File> | null | undefined,
): File | null =>
  Array.from(files ?? []).find((file) => file.type.startsWith('image/')) ??
  null;
