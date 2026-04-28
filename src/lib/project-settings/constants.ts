export const TAG_LIMIT = 24;

export const ICON_OPTIONS: { id: string; emoji: string; label: string }[] = [
  { id: 'clipboard', emoji: '📋', label: 'Clipboard' },
  { id: 'target', emoji: '🎯', label: 'Target' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'shield', emoji: '🛡️', label: 'Shield' },
  { id: 'lightning', emoji: '⚡', label: 'Lightning' },
  { id: 'puzzle', emoji: '🧩', label: 'Puzzle' },
  { id: 'leaf', emoji: '🌿', label: 'Leaf' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
];

export const ACCENT_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#64748b', label: 'Slate' },
];

export interface TagPalette {
  value: string;
  bg: string;
  border: string;
  text: string;
}

export const TAG_PALETTE: TagPalette[] = [
  { value: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', text: '#1d4ed8' },
  { value: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)', text: '#047857' },
  { value: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#b45309' },
  { value: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', text: '#b91c1c' },
  { value: '#ec4899', bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.30)', text: '#be185d' },
  { value: '#06b6d4', bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.30)', text: '#0e7490' },
  { value: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.30)', text: '#6d28d9' },
  { value: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.30)', text: '#334155' },
];
