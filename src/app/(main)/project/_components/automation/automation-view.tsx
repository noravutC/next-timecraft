'use client';

import { useOpenTask } from '@/components/task-detail/use-open-task';
import { useBoardAccess } from '@/components/project/use-board-access';
import { useProjectStore } from '@/store';
import { useAutomationStore } from '@/store/use-automation.store';
import { useRealtimeBoard } from '@/store/sync-live-data/useRealtimeBoard';
import { ArchivedBoardBanner } from '../archived-board-banner';
import { BoardLoadError } from '../board-load-error';
import { AutomationEmpty } from './automation-empty';
import { AutomationSheets } from './automation-sheets';
import { AutomationSkeleton } from './automation-skeleton';
import { AutomationToolbar } from './automation-toolbar';
import { HistorySection } from './history-section';
import { RulesSection } from './rules-section';
import { TemplatesSection } from './templates-section';
import { useAutomation } from './use-automation';
import { useAutomationActions } from './use-automation-actions';
import { useHistory } from './use-history';
import { WebhooksSection } from './webhooks-section';

/** What the board does on its own: rules, templates, webhooks and their history. */
export function AutomationView() {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const templatesById = useAutomationStore((s) => s.templates);
  const automation = useAutomation(projectId);
  const actions = useAutomationActions(automation, projectId);
  const { section, setSection, loaded } = automation;
  const history = useHistory(projectId, section === 'history');
  const openTask = useOpenTask();
  const canCreateTasks = useBoardAccess().can('task:create');
  useRealtimeBoard(projectId);

  const toHistory = (failedOnly: boolean) => {
    actions.close();
    history.setKind(failedOnly ? 'all' : 'rules');
    history.setFailedOnly(failedOnly);
    setSection('history');
  };
  const primary = {
    rules: automation.canManage
      ? { label: 'New rule', onClick: actions.newRule }
      : null,
    templates: automation.canEditTemplates
      ? { label: 'New template', onClick: actions.newTemplate }
      : null,
    webhooks:
      automation.canManage && automation.webhooksAllowed
        ? { label: 'Add webhook', onClick: actions.newWebhook }
        : null,
    history: null,
  }[section];

  return (
    <div className="relative flex h-full flex-col bg-background">
      <AutomationToolbar
        section={section}
        onSection={setSection}
        counts={
          loaded
            ? {
                rules: automation.rules.length,
                templates: automation.templates.length,
                // only for those who can see them
                ...(automation.canManage && automation.webhooksAllowed
                  ? { webhooks: automation.webhooks.length }
                  : {}),
              }
            : {}
        }
        primary={loaded ? primary : null}
      />
      <ArchivedBoardBanner />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface p-5">
        <div className="flex w-full shrink-0 grow flex-col gap-4">
          {automation.failed && (
            <BoardLoadError
              name={automation.boardName}
              onRetry={automation.retry}
            />
          )}
          {!automation.failed && !loaded && <AutomationSkeleton />}
          {loaded &&
            section === 'rules' &&
            (automation.rules.length > 0 ? (
              <RulesSection
                summary={automation.summary}
                groups={automation.groups}
                ideas={automation.ideas}
                people={automation.people}
                tagColors={automation.tagColors}
                canManage={automation.canManage}
                onOpen={actions.openRule}
                onToggle={actions.toggleRule}
                onDelete={actions.askDeleteRule}
                onIdea={actions.useIdea}
                onBroken={() => toHistory(true)}
              />
            ) : (
              <AutomationEmpty
                ideas={automation.ideas}
                canManage={automation.canManage}
                onIdea={actions.useIdea}
                onNew={actions.newRule}
              />
            ))}
          {loaded && section === 'templates' && (
            <TemplatesSection
              cards={automation.templateCards}
              people={automation.people}
              tagColors={automation.tagColors}
              columns={automation.board.columns}
              canEdit={automation.canEditTemplates}
              canUse={canCreateTasks}
              onOpen={actions.openTemplate}
              onUse={actions.useTemplate}
              onNew={actions.newTemplate}
            />
          )}
          {loaded && section === 'webhooks' && (
            <WebhooksSection
              rows={automation.webhookRows}
              canManage={automation.canManage}
              allowed={automation.webhooksAllowed}
              onOpen={actions.openWebhook}
              onToggle={actions.toggleWebhook}
              onDelete={actions.askDeleteWebhook}
              onFailed={() => toHistory(true)}
              onNew={actions.newWebhook}
            />
          )}
          {loaded && section === 'history' && (
            <HistorySection
              history={history}
              canManage={automation.canManage}
              canResend={automation.canManage && automation.webhooksAllowed}
              onOpenTask={(taskId) => void openTask(taskId)}
            />
          )}
        </div>
      </div>
      <AutomationSheets
        projectId={projectId}
        automation={automation}
        actions={actions}
        templates={templatesById}
        onHistory={() => toHistory(false)}
      />
    </div>
  );
}
