/** Monogram tones (pastel fill + dark letter), defined as --tone-* in globals.css. */
export type Tone =
  | 'violet'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'cyan'
  | 'slate';

const PEOPLE_TONES: Tone[] = [
  'violet',
  'green',
  'orange',
  'blue',
  'pink',
  'cyan',
  'red',
];

/** Stable tone for a person, picked from their id (or name/email). */
export const toneFor = (seed: string): Tone => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PEOPLE_TONES[hash % PEOPLE_TONES.length];
};
