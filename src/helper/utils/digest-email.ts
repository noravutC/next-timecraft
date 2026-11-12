import type { AttentionKind, DigestContents } from '@/types';
import {
  ATTENTION_LABELS,
  attentionWhy,
  compareNote,
  digestSubject,
  digestWeek,
  spanParts,
} from './insights';
import { shortName } from './person-name';

export type DigestTone = 'danger' | 'warning' | 'neutral';

export type DigestEmailContent = {
  subject: string;
  boardName: string;
  /** "Week of Nov 2 to Nov 8" */
  weekLabel: string;
  tiles: { value: string; unit: string; label: string; note: string }[];
  finished: { title: string; by: string }[];
  finishedMore: number;
  attention: { label: string; tone: DigestTone; title: string; why: string }[];
  attentionMore: number;
};

const TONES: Record<AttentionKind, DigestTone> = {
  overdue: 'danger',
  stuck: 'warning',
  blocked: 'neutral',
  due_soon: 'neutral',
};

/**
 * A week with nothing to report (nothing finished, nothing due, nothing in
 * trouble): an empty email isn't worth sending.
 */
export const digestIsEmpty = (contents: DigestContents): boolean =>
  contents.completed === 0 &&
  contents.attention.length === 0 &&
  contents.dueThisWeek === 0;

/** What a weekly digest says, ready for the template. */
export const digestEmailContent = (
  contents: DigestContents,
  board: { name: string; weekKey: string; timeZone: string },
): DigestEmailContent => {
  const { completed, attention, dueThisWeek, median, overdue } = contents;
  const taken = median === null ? null : spanParts(median);
  return {
    subject: digestSubject(board.name, completed),
    boardName: board.name,
    weekLabel: `Week of ${digestWeek(board.weekKey, board.timeZone).label}`,
    tiles: [
      {
        value: String(completed),
        unit: '',
        label: 'Completed',
        note: compareNote(
          completed,
          contents.previousCompleted,
          'the week before',
        ),
      },
      {
        value: taken?.value ?? 'None',
        unit: taken?.unit ?? '',
        label: 'Time to done',
        note: taken ? 'Median, created to Done' : 'Nothing finished last week',
      },
      {
        value: String(dueThisWeek),
        unit: '',
        label: 'Due this week',
        note: overdue === 0 ? 'None overdue' : `${overdue} overdue`,
      },
    ],
    finished: contents.finished.map((f) => ({
      title: f.title,
      by: shortName(f.by),
    })),
    finishedMore: completed - contents.finished.length,
    attention: attention.map((item) => ({
      label: ATTENTION_LABELS[item.kind],
      tone: TONES[item.kind],
      title: item.title,
      why: attentionWhy(item, board.timeZone),
    })),
    attentionMore: contents.attentionTotal - attention.length,
  };
};
