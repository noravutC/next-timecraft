/** A key on a shortcut row; 'mod' shows as ⌘ or Ctrl. `then` follows it ("or"). */
export type ShortcutKey = { key: string; then?: string };

export type ShortcutGroup = {
  title: string;
  rows: { label: string; keys: ShortcutKey[] }[];
};

const keys = (...list: string[]): ShortcutKey[] => list.map((key) => ({ key }));

/** Every shortcut the app has, as the ? dialog lists them. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Anywhere on a board',
    rows: [
      { label: 'Search tasks and switch boards', keys: keys('mod', 'K') },
      { label: 'Undo the last change', keys: keys('mod', 'Z') },
      { label: 'Show keyboard shortcuts', keys: keys('?') },
      { label: 'Close a dialog, menu or sheet', keys: keys('esc') },
    ],
  },
  {
    title: 'Board',
    rows: [
      { label: 'New task in the first column', keys: keys('N') },
      { label: 'Search tasks on this board', keys: keys('/') },
      { label: 'Pan the board', keys: [{ key: 'Space', then: '+ drag' }] },
    ],
  },
  {
    title: 'Adding a card',
    rows: [
      { label: 'Add the card', keys: keys('↵') },
      { label: 'Cancel', keys: keys('esc') },
    ],
  },
  {
    title: 'Task sheet and comments',
    rows: [
      { label: 'Send comment', keys: keys('mod', '↵') },
      {
        label: 'Bold, italic',
        keys: [{ key: 'mod' }, { key: 'B', then: 'or' }, { key: 'I' }],
      },
      { label: 'Mention someone', keys: keys('@') },
      { label: 'Pick a mention', keys: keys('↑', '↓', '↵') },
    ],
  },
];

/** Typing fields keep their keys: shortcuts wait until focus leaves them. */
export const isTypingTarget = (target: EventTarget | null): boolean =>
  typeof HTMLElement !== 'undefined' &&
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

/** The board's "Search tasks" field, which / focuses. */
export const BOARD_SEARCH_ID = 'board-search';
