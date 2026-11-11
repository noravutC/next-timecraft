'use client';

import { useEffect } from 'react';
import { useOpenTask } from '@/components/task-detail/use-open-task';
import { useNavStore, useProjectStore } from '@/store';
import { useColumnStore } from '@/store/use-column.store';
import { useRealtimeBoard } from '@/store/sync-live-data/useRealtimeBoard';
import { ArchivedBoardBanner } from '../archived-board-banner';
import { BoardLoadError } from '../board-load-error';
import { AttentionCard } from './attention-card';
import { FlowChart } from './flow-chart';
import { InsightTiles } from './insight-tiles';
import { InsightsEmpty } from './insights-empty';
import { periodText, tileGroups, weekSummary } from './insights-operations';
import { InsightsSkeleton } from './insights-skeleton';
import { InsightsSummary } from './insights-summary';
import { InsightsToolbar } from './insights-toolbar';
import { UpcomingCard } from './upcoming-card';
import { useInsights } from './use-insights';
import { WaitCard } from './wait-card';
import { WorkloadCard } from './workload-card';

/** The board as its numbers: what got finished, what waits, who holds what. */
export function InsightsView() {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const boardName = useProjectStore((s) =>
    s.projectIsUsing ? (s.projects[s.projectIsUsing]?.name ?? '') : '',
  );
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const setBoardView = useNavStore((s) => s.setBoardView);
  const openTask = useOpenTask();
  const { weeks, setWeeks, timeZone, data, failed, retry } =
    useInsights(projectId);
  useRealtimeBoard(projectId);
  // a task opened from here needs the board's columns for its status
  useEffect(() => {
    if (projectId) fetchColumns(projectId).catch(() => {});
  }, [projectId, fetchColumns]);

  const toBoard = () => setBoardView('board');

  return (
    <div className="relative flex h-full flex-col bg-background">
      <InsightsToolbar
        projectId={projectId}
        weeks={weeks}
        onWeeks={setWeeks}
        periodText={data ? periodText(data.completed.byWeek) : ''}
        showControls={data?.hasDoneColumn ?? true}
      />
      <ArchivedBoardBanner />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface p-5">
        <div className="flex w-full shrink-0 grow flex-col gap-4">
          {failed && <BoardLoadError name={boardName} onRetry={retry} />}
          {!failed && !data && <InsightsSkeleton />}
          {!failed && data && !data.hasDoneColumn && (
            <InsightsEmpty kind="no-done" onBoard={toBoard} />
          )}
          {!failed && data?.hasDoneColumn && (
            <>
              {data.hasFinished && <InsightsSummary text={weekSummary(data)} />}
              <InsightTiles groups={tileGroups(data)} />
              {data.hasFinished ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    <FlowChart
                      finished={data.completed.byWeek}
                      created={data.created.byWeek}
                    />
                    <WaitCard
                      waits={data.waits}
                      tasks={data.waitTasks}
                      weeks={data.weeks}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <AttentionCard
                      items={data.attention}
                      total={data.attentionTotal}
                      onOpen={(taskId) => void openTask(taskId)}
                    />
                    <UpcomingCard
                      items={data.upcoming}
                      total={data.upcomingTotal}
                      timeZone={timeZone}
                      onOpen={(taskId) => void openTask(taskId)}
                    />
                    <WorkloadCard workload={data.workload} weeks={data.weeks} />
                  </div>
                </>
              ) : (
                <InsightsEmpty kind="nothing" onBoard={toBoard} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
