'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { brokenReasonOf, templateUses } from './automation-operations';
import { RuleSheet } from './rule-sheet';
import { TemplateSheet } from './template-sheet';
import type { Automation } from './use-automation';
import type { AutomationActions } from './use-automation-actions';
import { WebhookSheet } from './webhook-sheet';

const DELETE_LABELS = {
  rule: 'Delete rule',
  template: 'Delete template',
  webhook: 'Delete webhook',
} as const;

/** The sheet that is open over the Automation view, and the delete question. */
export const AutomationSheets = ({
  projectId,
  automation,
  actions,
  templates,
  onHistory,
}: {
  projectId: string | null;
  automation: Automation;
  actions: AutomationActions;
  /** by id, for a step that makes a task from one */
  templates: Record<string, Automation['templates'][number]>;
  /** to History, from a rule's last runs */
  onHistory: () => void;
}) => {
  const { sheet, pending } = actions;
  return (
    <>
      {sheet?.kind === 'rule' && (
        <RuleSheet
          key={sheet.key}
          projectId={projectId}
          ruleId={sheet.ruleId}
          initial={sheet.initial}
          brokenReason={brokenReasonOf(automation.rules, sheet.ruleId)}
          board={automation.board}
          names={automation.names}
          templates={templates}
          timeZone={automation.timeZone}
          canManage={automation.canManage}
          onClose={actions.close}
          onSave={actions.saveRule}
          onDelete={() => sheet.ruleId && actions.askDeleteRule(sheet.ruleId)}
          onHistory={onHistory}
          onEditTemplate={actions.openTemplate}
        />
      )}
      {sheet?.kind === 'template' && (
        <TemplateSheet
          key={sheet.key}
          templateId={sheet.templateId}
          initial={sheet.initial}
          board={automation.board}
          tagColors={automation.tagColors}
          uses={
            sheet.templateId
              ? templateUses(
                  sheet.templateId,
                  automation.rules,
                  automation.names,
                  automation.timeZone,
                )
              : []
          }
          canEdit={automation.canEditTemplates}
          onClose={actions.close}
          onSave={actions.saveTemplate}
          onDelete={() =>
            sheet.templateId && actions.askDeleteTemplate(sheet.templateId)
          }
          onOpenRule={actions.openRule}
        />
      )}
      {sheet?.kind === 'webhook' && (
        <WebhookSheet
          key={sheet.key}
          webhookId={sheet.webhookId}
          initial={sheet.initial}
          secret={sheet.secret}
          onClose={actions.close}
          onSave={actions.saveWebhook}
          onDelete={() =>
            sheet.webhookId && actions.askDeleteWebhook(sheet.webhookId)
          }
          onTest={actions.testWebhook}
        />
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && actions.cancelDelete()}
        variant="destructive"
        title={pending?.title ?? ''}
        description={pending?.description}
        primaryLabel={pending ? DELETE_LABELS[pending.kind] : 'Delete'}
        onConfirm={actions.confirmDelete}
      />
    </>
  );
};
