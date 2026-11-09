'use client';

import { useEffect } from 'react';
import { runUndo } from './offer-undo';

/** Typing fields keep their own undo. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, [contenteditable="true"]'));

/** ⌘Z / Ctrl+Z takes back the last change on the board. */
export function useUndoShortcut() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'z' || e.shiftKey) return;
      if (!(e.metaKey || e.ctrlKey) || isTyping(e.target)) return;
      e.preventDefault();
      void runUndo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
