import type { TaskPriority } from '@/types';

/**
 * สี/label ประจำ priority — single source ใช้ร่วมระหว่าง
 * task-detail (PriorityPill) และ board card (priority flag)
 */
export const PRIORITY_STYLES: Record<
  TaskPriority,
  { bg: string; border: string; text: string; label: string }
> = {
  low: {
    bg: 'rgba(100,116,139,0.10)',
    border: 'rgba(100,116,139,0.30)',
    text: '#334155',
    label: 'Low',
  },
  medium: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    text: '#1d4ed8',
    label: 'Medium',
  },
  high: {
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
    text: '#b91c1c',
    label: 'High',
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ['low', 'medium', 'high'];
