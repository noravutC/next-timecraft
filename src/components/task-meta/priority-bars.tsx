import type { TaskPriority } from '@/types';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { cn } from '@/lib/utils';

// 3 แท่งเรียงจากเตี้ยไปสูง (viewBox 14×14)
const BARS = [
  { x: 1, y: 8, height: 5 },
  { x: 5.5, y: 5, height: 8 },
  { x: 10, y: 2, height: 11 },
];

// priority แบบแท่งสัญญาณ: low 1 แท่ง, medium 2, high 3 — อ่านจากจำนวนแท่งได้
// ไม่ต้องพึ่งสีอย่างเดียว
export const PriorityBars = ({
  priority,
  color,
  decorative = false,
  className,
}: {
  priority: TaskPriority;
  /** Override the bar color, e.g. a neutral icon on the Priority filter. */
  color?: string;
  /** Pure icon next to a visible label: hide it from screen readers. */
  decorative?: boolean;
  className?: string;
}) => {
  const level = PRIORITY_ORDER.indexOf(priority) + 1;
  const style = PRIORITY_STYLES[priority];

  return (
    <svg
      viewBox="0 0 14 14"
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': `${style.label} priority` })}
      className={cn('size-3.5 shrink-0', className)}
    >
      {BARS.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={3}
          height={bar.height}
          rx={1}
          fill={i < level ? (color ?? style.dot) : 'var(--input)'}
        />
      ))}
    </svg>
  );
};
