'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { browserTimeZone } from '@/helper/utils/time-zone';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { useProjectStore, useUserStore } from '@/store';
import { useAutomationStore } from '@/store/use-automation.store';
import { useColumnStore } from '@/store/use-column.store';
import { withSettingsDefaults } from '@/types/project-settings';
import {
  boardContext,
  namesOf,
  ruleGroups,
  ruleIdeas,
  rulesSummary,
  templateCards,
  webhookRows,
  weekStart,
  type AutomationSection,
} from './automation-operations';

/** A board's rules, templates and webhooks, and what the pickers offer. */
export function useAutomation(projectId: string | null) {
  const [section, setSection] = useState<AutomationSection>('rules');
  // "this week" is the viewer's week, like Insights
  const [browserZone] = useState(browserTimeZone);
  const [attempt, setAttempt] = useState(0);

  const project = useProjectStore((s) =>
    projectId ? (s.projects[projectId] ?? null) : null,
  );
  const columns = useColumnStore(useShallow((s) => s.columns));
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const data = useAutomationStore(
    useShallow((s) => ({
      loadedFor: s.loadedFor,
      status: s.status,
      rules: s.rules,
      templates: s.templates,
      webhooks: s.webhooks,
      timeZone: s.timeZone,
      canManage: s.canManage,
      canEditTemplates: s.canEditTemplates,
      webhooksAllowed: s.webhooksAllowed,
    })),
  );
  const fetchBoard = useAutomationStore((s) => s.fetchBoard);

  useEffect(() => {
    if (!projectId) return;
    fetchBoard(projectId, weekStart(new Date(), browserZone)).catch(() => {});
    // the pickers offer the board's columns
    fetchColumns(projectId).catch(() => {});
  }, [projectId, browserZone, attempt, fetchBoard, fetchColumns]);

  const members = project?.members;
  useEffect(() => {
    if (members?.length) void fetchUsers(members.map((m) => m.userId));
  }, [members, fetchUsers]);

  const tagColors = useMemo(
    () => withSettingsDefaults(project?.settings ?? null).tagColors,
    [project?.settings],
  );
  const rules = useMemo(() => Object.values(data.rules), [data.rules]);
  const templates = useMemo(
    () => Object.values(data.templates),
    [data.templates],
  );
  const webhooks = useMemo(() => Object.values(data.webhooks), [data.webhooks]);

  const board = useMemo(
    () =>
      boardContext({
        projectId,
        columns: Object.values(columns),
        memberIds: (members ?? []).map((m) => m.userId),
        users,
        labels: project?.tags ?? [],
        labelColors: Object.fromEntries(
          (project?.tags ?? []).map((tag) => [
            tag,
            paletteFor(tagColors[tag] ?? hashTagColor(tag)).value,
          ]),
        ),
        templates,
      }),
    [projectId, columns, members, users, project?.tags, tagColors, templates],
  );
  const names = useMemo(() => namesOf(board), [board]);
  const people = useMemo(
    () => Object.fromEntries(board.members.map((m) => [m.id, m])),
    [board.members],
  );
  const loaded = data.loadedFor === projectId;

  return {
    section,
    setSection,
    loaded,
    failed: data.status === 'error' && !loaded,
    retry: () => setAttempt((n) => n + 1),
    boardName: project?.name ?? null,
    board,
    names,
    people,
    tagColors,
    rules,
    templates,
    webhooks,
    /** the workspace's zone: what schedules count in */
    timeZone: data.timeZone,
    canManage: data.canManage,
    canEditTemplates: data.canEditTemplates,
    webhooksAllowed: data.webhooksAllowed,
    groups: useMemo(
      () => ruleGroups(rules, names, data.timeZone),
      [rules, names, data.timeZone],
    ),
    summary: useMemo(() => rulesSummary(rules), [rules]),
    ideas: useMemo(() => ruleIdeas(board, rules), [board, rules]),
    templateCards: useMemo(
      () => templateCards(templates, rules, names),
      [templates, rules, names],
    ),
    webhookRows: useMemo(() => webhookRows(webhooks), [webhooks]),
  };
}

export type Automation = ReturnType<typeof useAutomation>;
