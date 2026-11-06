import { BOARD_TEMPLATES, type BoardTemplate } from '@/helper/default-project';
import type { CreateColumnPayload } from '@/types';

type TemplateColumns = Pick<BoardTemplate, 'columns'>;

/** Template by id; unknown ids fall back to the first (Kanban Board). */
export const findBoardTemplate = (id: string): BoardTemplate =>
  BOARD_TEMPLATES.find((t) => t.id === id) ?? BOARD_TEMPLATES[0];

/** The column flow shown under the picker: "Backlog → To Do → Done". */
export const templateFlow = (template: TemplateColumns): string =>
  template.columns.map((c) => c.name).join(' → ');

/** Columns to create for a new board (blank fraction = server appends in order). */
export const templateColumnsPayload = (
  template: TemplateColumns,
  projectId: string,
): CreateColumnPayload[] =>
  template.columns.map((c) => ({
    name: c.name,
    color: c.color,
    projectId,
    orderFraction: '',
  }));
