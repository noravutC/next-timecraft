import type { TaskPriority } from '@/types';

/**
 * สี/label ประจำ priority — single source ใช้ร่วมระหว่าง
 * task-detail (PriorityPill), board card (priority flag) และ board filter
 *
 * ค่าสีจริงเป็น token `--priority-*` ใน globals.css — ห้าม hardcode hex ที่นี่
 * dot = สีสดสำหรับจุด/ธง, text = เฉดเข้มสำหรับตัวหนังสือบนพื้น soft
 */
export const PRIORITY_STYLES: Record<
  TaskPriority,
  { dot: string; bg: string; border: string; text: string; label: string }
> = {
  low: {
    dot: 'var(--priority-low)',
    bg: 'var(--priority-low-soft)',
    border: 'var(--priority-low-line)',
    text: 'var(--priority-low-text)',
    label: 'Low',
  },
  medium: {
    dot: 'var(--priority-medium)',
    bg: 'var(--priority-medium-soft)',
    border: 'var(--priority-medium-line)',
    text: 'var(--priority-medium-text)',
    label: 'Medium',
  },
  high: {
    dot: 'var(--priority-high)',
    bg: 'var(--priority-high-soft)',
    border: 'var(--priority-high-line)',
    text: 'var(--priority-high-text)',
    label: 'High',
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ['low', 'medium', 'high'];
