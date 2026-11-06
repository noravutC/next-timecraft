import { create } from 'zustand';

// dialog ของบอร์ด (switch/create/settings) — อยู่ใน store เพราะเปิดได้
// จากหลายที่ (ชื่อบอร์ดบน header, แถบเครื่องมือ, ⌘K)
export type BoardDialog = 'switch' | 'create' | 'settings' | null;

export type BoardSettingsTab =
  | 'general'
  | 'tags'
  | 'members'
  | 'archive'
  | 'danger';

interface NavState {
  boardDialog: BoardDialog;
  /** เปิด settings ผ่านทางนี้จะเริ่มที่แท็บ General เสมอ */
  setBoardDialog: (dialog: BoardDialog) => void;
  /** แท็บที่ Board settings เปิดอยู่ */
  settingsTab: BoardSettingsTab;
  setSettingsTab: (tab: BoardSettingsTab) => void;
  /** เปิด Board settings ที่แท็บที่ระบุ เช่นปุ่ม Invite → 'members' */
  openBoardSettings: (tab?: BoardSettingsTab) => void;
  /** เพิ่มขึ้นทุกครั้งที่กด "New task" — column แรกเห็นค่าเปลี่ยนแล้วเปิด composer บนสุด */
  newTaskSignal: number;
  requestNewTask: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  boardDialog: null,
  setBoardDialog: (boardDialog) =>
    set(
      boardDialog === 'settings'
        ? { boardDialog, settingsTab: 'general' }
        : { boardDialog },
    ),
  settingsTab: 'general',
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  openBoardSettings: (settingsTab = 'general') =>
    set({ boardDialog: 'settings', settingsTab }),
  newTaskSignal: 0,
  requestNewTask: () => set((s) => ({ newTaskSignal: s.newTaskSignal + 1 })),
}));
