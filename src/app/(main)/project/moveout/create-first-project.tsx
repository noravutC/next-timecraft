'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import { useProjectStore } from '@/store';
import { canCreateBoards } from '@/lib/rbac/workspace-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplatePicker } from '@/components/board-templates/template-picker';
import { useCreateBoard } from '@/components/board-templates/use-create-board';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { BOARD_TEMPLATES } from '@/helper/default-project';
import {
  findBoardTemplate,
  templateFlow,
} from '@/helper/utils/board-templates';
import { FirstBoardHeader } from './first-board-header';
import { BoardCoverField } from './board-cover-field';
import { useBoardCover } from './use-board-cover';
import { NoBoardsYet } from './no-boards-yet';

/** Empty workspace: name the first board and pick its template. */
export const CreateFirstProject = () => {
  const workspace = useWorkspace();
  const workspaceName = workspace?.name ?? null;
  const hasBoards = useProjectStore((s) => Object.keys(s.projects).length > 0);
  const setNeedCreateProject = useProjectStore((s) => s.setNeedCreateProject);
  const { creating, createBoard } = useCreateBoard();
  const cover = useBoardCover();

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(BOARD_TEMPLATES[0].id);
  const canCreate = name.trim().length > 0 && !creating;

  const { data: session } = useSession();

  const handleCreate = () => {
    if (!canCreate) return;
    void createBoard({ name, templateId, coverImage: cover.coverImage });
  };

  // members and board guests can't create boards here: nothing to set up
  if (session && !canCreateBoards(session.user?.orgRole)) {
    return (
      <NoBoardsYet
        workspace={workspace}
        canStartWorkspace={
          Boolean(session.user?.canCreateOrg) && !session.user?.organizationId
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <FirstBoardHeader workspace={workspace} />

      <main className="flex flex-1 justify-center px-5 py-16">
        <div className="flex w-full max-w-190 flex-col gap-7">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs leading-5 text-ink-subtle">
              {workspaceName ? `Welcome to ${workspaceName}` : 'Welcome'}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Create your first board
            </h1>
            <p className="text-md text-ink-muted">
              Pick a template and the columns are set up for you. Add cards as
              soon as it opens.
            </p>
          </div>

          <div className="flex max-w-105 flex-col gap-2">
            <Label htmlFor="first-board-name" className="leading-5">
              Board name
            </Label>
            <Input
              id="first-board-name"
              inputSize="lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              placeholder="e.g. Q4 Launch Plan"
              className="h-10 rounded-lg text-md"
            />
            <BoardCoverField
              coverImage={cover.coverImage}
              onPick={(file) => void cover.pickFile(file)}
              onClear={cover.clear}
            />
          </div>

          <TemplatePicker
            value={templateId}
            onChange={setTemplateId}
            layout="page"
          />

          <div className="flex items-center gap-4 border-t border-line-soft pt-5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-subtle">
              {templateFlow(findBoardTemplate(templateId))}
            </span>
            {hasBoards && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setNeedCreateProject(false)}
              >
                Back to boards
              </Button>
            )}
            <Button size="lg" disabled={!canCreate} onClick={handleCreate}>
              {creating ? 'Creating…' : 'Create board'}
              <ArrowRight className="size-3.75" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
