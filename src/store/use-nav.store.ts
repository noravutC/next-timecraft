import { create } from 'zustand';

// dialog ของบอร์ด (switch/create/settings) — อยู่ใน store เพราะเปิดได้
// จากหลายที่ (ชื่อบอร์ดบน header, แถบเครื่องมือ, ⌘K)
export type BoardDialog = 'switch' | 'create' | 'settings' | null;

interface NavState {
  boardDialog: BoardDialog;
  setBoardDialog: (dialog: BoardDialog) => void;
  /** เพิ่มขึ้นทุกครั้งที่กด "New task" — column แรกเห็นค่าเปลี่ยนแล้วเปิด composer บนสุด */
  newTaskSignal: number;
  requestNewTask: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  boardDialog: null,
  setBoardDialog: (boardDialog) => set({ boardDialog }),
  newTaskSignal: 0,
  requestNewTask: () => set((s) => ({ newTaskSignal: s.newTaskSignal + 1 })),
}));
