'use client';

import { useNavStore } from '@/store';
import { BoardView } from './_components/board-view';
import { CalendarView } from './_components/calendar/calendar-view';
import { InsightsView } from './_components/insights/insights-view';

export default function ProjectPage() {
  const view = useNavStore((s) => s.boardView);
  if (view === 'calendar') return <CalendarView />;
  if (view === 'insights') return <InsightsView />;
  return <BoardView />;
}
