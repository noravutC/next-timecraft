'use client';

import { useEffect, useRef } from 'react';
import { useNavStore } from '@/store';
import { ProjectSwitcherPanel } from './project-switcher-panel';
import { CreateBoardDialog } from './create-board-dialog';
import { BoardSettingsDialog } from './board-settings-dialog';
import { ShortcutsDialog } from './shortcuts-dialog';
import { useBoardAccess } from '@/components/project/use-board-access';
import { BOARD_SEARCH_ID, isTypingTarget } from '@/helper/utils/shortcuts';

// dialog ทั้งชุดของบอร์ด mount ที่เดียว — เปิดผ่าน useNavStore.boardDialog
export const BoardDialogs = () => {
  const boardDialog = useNavStore((s) => s.boardDialog);
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  // N only for people who can add tasks here (read in the key handler)
  const canAddTasks = useBoardAccess().can('task:create');
  const canAddTasksRef = useRef(canAddTasks);
  useEffect(() => {
    canAddTasksRef.current = canAddTasks;
  }, [canAddTasks]);

  // ⌘K / Ctrl+K เปิด-ปิดตัวสลับบอร์ดได้จากทุกที่บนหน้าบอร์ด
  // ? shortcuts, N new task, / search: outside text fields, nothing open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const nav = useNavStore.getState();
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        nav.setBoardDialog(nav.boardDialog === 'switch' ? null : 'switch');
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target))
        return;
      // another dialog or menu has the keyboard
      if (
        nav.boardDialog ||
        document.querySelector('[role="dialog"], [role="menu"]')
      ) {
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        nav.setBoardDialog('shortcuts');
      } else if (e.key.toLowerCase() === 'n' && canAddTasksRef.current) {
        e.preventDefault();
        nav.requestNewTask();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById(BOARD_SEARCH_ID)?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <ProjectSwitcherPanel
        open={boardDialog === 'switch'}
        onClose={() => setBoardDialog(null)}
      />
      <CreateBoardDialog
        open={boardDialog === 'create'}
        onClose={() => setBoardDialog(null)}
      />
      <BoardSettingsDialog
        open={boardDialog === 'settings'}
        onClose={() => setBoardDialog(null)}
      />
      <ShortcutsDialog
        open={boardDialog === 'shortcuts'}
        onClose={() => setBoardDialog(null)}
      />
    </>
  );
};
