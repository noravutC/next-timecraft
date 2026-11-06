'use client';

import { useEffect } from 'react';
import { useNavStore } from '@/store';
import { ProjectSwitcherPanel } from './project-switcher-panel';
import { CreateBoardDialog } from './create-board-dialog';
import { BoardSettingsDialog } from './board-settings-dialog';

// dialog ทั้งชุดของบอร์ด mount ที่เดียว — เปิดผ่าน useNavStore.boardDialog
export const BoardDialogs = () => {
  const { boardDialog, setBoardDialog } = useNavStore();

  // ⌘K / Ctrl+K เปิด-ปิดตัวสลับบอร์ดได้จากทุกที่บนหน้าบอร์ด
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const { boardDialog: current, setBoardDialog: open } =
        useNavStore.getState();
      open(current === 'switch' ? null : 'switch');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <ProjectSwitcherPanel
        open={boardDialog === 'switch'}
        onClose={() => setBoardDialog(null)}
        onCreateNew={() => setBoardDialog('create')}
      />
      <CreateBoardDialog
        open={boardDialog === 'create'}
        onClose={() => setBoardDialog(null)}
      />
      <BoardSettingsDialog
        open={boardDialog === 'settings'}
        onClose={() => setBoardDialog(null)}
      />
    </>
  );
};
