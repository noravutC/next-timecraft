'use client';

import { useNavStore } from '@/store';
import { BoardView } from './_components/board-view';
import { CalendarView } from './_components/calendar/calendar-view';

export default function ProjectPage() {
  const view = useNavStore((s) => s.boardView);
  return view === 'calendar' ? <CalendarView /> : <BoardView />;
}
