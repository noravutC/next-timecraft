/** Mac, iPhone and iPad label the modifier ⌘; everything else uses Ctrl. */
export const isApplePlatform = (): boolean =>
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.userAgent);

/** Modifier key label for shortcut hints, e.g. "⌘" + "K". */
export const modKeyLabel = (): string => (isApplePlatform() ? '⌘' : 'Ctrl');

/** "⌘Z" on Apple keyboards, "Ctrl Z" elsewhere. */
export const shortcutLabel = (key: string): string =>
  isApplePlatform() ? `⌘${key}` : `Ctrl ${key}`;
