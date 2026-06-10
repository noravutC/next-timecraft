export type EditorResult = {
  value: string;
  cursor: number;
};

export function applyWrap(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
): EditorResult {
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);
  const next = `${before}${marker}${selected}${marker}${after}`;
  const cursor = selected
    ? selectionStart + marker.length + selected.length + marker.length
    : selectionStart + marker.length;
  return { value: next, cursor };
}
