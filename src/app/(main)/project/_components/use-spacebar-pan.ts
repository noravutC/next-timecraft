import { useEffect, useRef, useState } from "react";

type PanCursor = "default" | "grab" | "grabbing";

const INTERACTIVE_SELECTOR = "input, textarea, [contenteditable], select";

/**
 * Spacebar-to-pan: hold Space → grab cursor; Space + drag → pan the scrollable element.
 * Skips activation when focus is inside an interactive element (input, textarea, etc.)
 */
export function useSpacebarPan(
  scrollRef: React.RefObject<HTMLElement | null>,
) {
  const [cursor, setCursor] = useState<PanCursor>("default");

  // Use refs for panning state so mousemove handler never has stale closures
  const isPanMode = useRef(false);
  const isPanning = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const isInteractiveFocus = () =>
      document.activeElement !== null &&
      document.activeElement !== document.body &&
      document.activeElement.matches(INTERACTIVE_SELECTOR);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isPanMode.current || e.repeat) return;
      if (isInteractiveFocus()) return;
      e.preventDefault();
      isPanMode.current = true;
      setCursor("grab");
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      isPanMode.current = false;
      isPanning.current = false;
      setCursor("default");
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isPanMode.current || e.button !== 0) return;
      isPanning.current = true;
      startX.current = e.clientX;
      startScrollLeft.current = element.scrollLeft;
      setCursor("grabbing");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      e.preventDefault();
      const dx = e.clientX - startX.current;
      element.scrollLeft = startScrollLeft.current - dx;
    };

    const onMouseUp = () => {
      if (!isPanning.current) return;
      isPanning.current = false;
      if (isPanMode.current) setCursor("grab");
    };

    // Prevent text selection while panning
    const onSelectStart = (e: Event) => {
      if (isPanMode.current) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    element.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("selectstart", onSelectStart);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      element.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("selectstart", onSelectStart);
    };
  }, [scrollRef]);

  return cursor;
}
