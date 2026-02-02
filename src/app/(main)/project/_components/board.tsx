'use client';

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { useContext, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { Column } from './column';
import {
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  columnMapFromBoard,
  TBoard,
  TColumn,
} from './data';
import { SettingsContext } from '@/context/kanban/setting-provider';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { bindAll } from 'bind-event-listener';
import { blockBoardPanningAttr } from './data-attributes';
import { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import { useBoardMapStore } from '@/hooks/store';
import { useProjectStore } from '@/hooks';
import { columnServices } from '@/lib/services/columns.service';
import { taskServices } from '@/lib/services/tasks.service';
import type { PayloadMoveTask } from '@/types';
import { toast } from 'sonner';

export function Board({ initial }: { initial: TBoard }) {
  const [data, setData] = useState(initial);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useContext(SettingsContext);
  const setColumnMap = useBoardMapStore((state) => state.setColumnMap);
  const projectId = useProjectStore((state) => state.projectIdActivate);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    const element = scrollableRef.current;
    invariant(element);
    const syncBoard = (nextData: TBoard) => {
      setData(nextData);
      setColumnMap((prev) => columnMapFromBoard(nextData, prev));
    };
    const rollbackBoard = (previousData: TBoard, previousColumnMap: ReturnType<typeof useBoardMapStore.getState>['columnMap']) => {
      setData(previousData);
      setColumnMap(previousColumnMap);
    };
    return combine(
      monitorForElements({
        canMonitor: isDraggingACard,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isCardData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];

          if (!innerMost) {
            return;
          }
          const dropTargetData = innerMost.data;
          const homeColumnIndex = data.columns.findIndex(
            (column) => column.id === dragging.columnId,
          );
          const home: TColumn | undefined = data.columns[homeColumnIndex];

          if (!home) {
            return;
          }
          const cardIndexInHome = home.cards.findIndex((card) => card.id === dragging.card.id);
          if (cardIndexInHome === -1) {
            return;
          }

          // dropping on a card
          if (isCardDropTargetData(dropTargetData)) {
            const destinationColumnIndex = data.columns.findIndex(
              (column) => column.id === dropTargetData.columnId,
            );
            const destinationColumn = data.columns[destinationColumnIndex];
            if (!destinationColumn) {
              return;
            }

            const indexOfTarget = destinationColumn.cards.findIndex(
              (card) => card.id === dropTargetData.card.id,
            );
            if (indexOfTarget === -1) {
              return;
            }

            const closestEdge = extractClosestEdge(dropTargetData);
            if (!closestEdge) {
              return;
            }

            const previousData = data;
            const previousColumnMap = useBoardMapStore.getState().columnMap;

            if (home.id === destinationColumn.id) {
              const reordered = reorderWithEdge({
                list: home.cards,
                closestEdgeOfTarget: closestEdge,
                startIndex: cardIndexInHome,
                indexOfTarget,
                axis: 'vertical',
              });
              const nextColumns = [...data.columns];
              nextColumns[homeColumnIndex] = { ...home, cards: reordered };
              syncBoard({ ...data, columns: nextColumns });
              const orderDestination = reordered.findIndex(
                (card) => card.id === dragging.card.id,
              );
              if (projectId) {
                const payload: PayloadMoveTask = {
                  activeTaskId: dragging.card.id,
                  projectId,
                  columnSouce: home.id,
                  orderDestination: orderDestination + 1,
                  columnDestination: home.id,
                };
                void taskServices
                  .moveTaskToDestination(dragging.card.id, JSON.stringify(payload))
                  .catch((error) => {
                    console.error('Failed to move task:', error);
                    toast.error('Failed to move task.');
                    rollbackBoard(previousData, previousColumnMap);
                  });
              }
              return;
            }

            const insertIndex = closestEdge === 'bottom' ? indexOfTarget + 1 : indexOfTarget;
            const nextHomeCards = home.cards.filter((card) => card.id !== dragging.card.id);
            const nextDestinationCards = [...destinationColumn.cards];
            nextDestinationCards.splice(insertIndex, 0, dragging.card);
            const nextColumns = [...data.columns];
            nextColumns[homeColumnIndex] = { ...home, cards: nextHomeCards };
            nextColumns[destinationColumnIndex] = {
              ...destinationColumn,
              cards: nextDestinationCards,
            };
            syncBoard({ ...data, columns: nextColumns });
            if (projectId) {
              const payload: PayloadMoveTask = {
                activeTaskId: dragging.card.id,
                projectId,
                columnSouce: home.id,
                orderDestination: insertIndex + 1,
                columnDestination: destinationColumn.id,
              };
              void taskServices
                .moveTaskToDestination(dragging.card.id, JSON.stringify(payload))
                .catch((error) => {
                  console.error('Failed to move task:', error);
                  toast.error('Failed to move task.');
                  rollbackBoard(previousData, previousColumnMap);
                });
            }
            return;
          }

          // dropping onto a column, but not onto a card
          if (isColumnData(dropTargetData)) {
            const destinationColumnIndex = data.columns.findIndex(
              (column) => column.id === dropTargetData.column.id,
            );
            const destinationColumn = data.columns[destinationColumnIndex];
            if (!destinationColumn) {
              return;
            }

            const previousData = data;
            const previousColumnMap = useBoardMapStore.getState().columnMap;

            if (home.id === destinationColumn.id) {
              if (cardIndexInHome === home.cards.length - 1) {
                return;
              }
              const nextCards = reorder({
                list: home.cards,
                startIndex: cardIndexInHome,
                finishIndex: home.cards.length - 1,
              });
              const nextColumns = [...data.columns];
              nextColumns[homeColumnIndex] = { ...home, cards: nextCards };
              syncBoard({ ...data, columns: nextColumns });
              if (projectId) {
                const payload: PayloadMoveTask = {
                  activeTaskId: dragging.card.id,
                  projectId,
                  columnSouce: home.id,
                  orderDestination: home.cards.length,
                  columnDestination: home.id,
                };
                void taskServices
                  .moveTaskToDestination(dragging.card.id, JSON.stringify(payload))
                  .catch((error) => {
                    console.error('Failed to move task:', error);
                    toast.error('Failed to move task.');
                    rollbackBoard(previousData, previousColumnMap);
                  });
              }
              return;
            }

            const nextHomeCards = home.cards.filter((card) => card.id !== dragging.card.id);
            const nextDestinationCards = [...destinationColumn.cards, dragging.card];
            const nextColumns = [...data.columns];
            nextColumns[homeColumnIndex] = { ...home, cards: nextHomeCards };
            nextColumns[destinationColumnIndex] = {
              ...destinationColumn,
              cards: nextDestinationCards,
            };
            syncBoard({ ...data, columns: nextColumns });
            if (projectId) {
              const payload: PayloadMoveTask = {
                activeTaskId: dragging.card.id,
                projectId,
                columnSouce: home.id,
                orderDestination: nextDestinationCards.length,
                columnDestination: destinationColumn.id,
              };
              void taskServices
                .moveTaskToDestination(dragging.card.id, JSON.stringify(payload))
                .catch((error) => {
                  console.error('Failed to move task:', error);
                  toast.error('Failed to move task.');
                  rollbackBoard(previousData, previousColumnMap);
                });
            }
          }
        },
      }),
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isColumnData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];

          if (!innerMost) {
            return;
          }
          const dropTargetData = innerMost.data;

          if (!isColumnData(dropTargetData)) {
            return;
          }

          const homeIndex = data.columns.findIndex((column) => column.id === dragging.column.id);
          const destinationIndex = data.columns.findIndex(
            (column) => column.id === dropTargetData.column.id,
          );

          if (homeIndex === -1 || destinationIndex === -1) {
            return;
          }

          if (homeIndex === destinationIndex) {
            return;
          }

          const reordered = reorder({
            list: data.columns,
            startIndex: homeIndex,
            finishIndex: destinationIndex,
          });
          const previousData = data;
          const previousColumnMap = useBoardMapStore.getState().columnMap;
          syncBoard({ ...data, columns: reordered });
          void columnServices
            .updateOnlyColumnOrder(dragging.column.id, { order: destinationIndex })
            .catch((error) => {
              console.error('Failed to reorder column:', error);
              toast.error('Failed to reorder column.');
              rollbackBoard(previousData, previousColumnMap);
            });
        },
      }),
      autoScrollForElements({
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        element,
      }),
      unsafeOverflowAutoScrollForElements({
        element,
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          if (!settings.isOverflowScrollingEnabled) {
            return false;
          }

          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getOverflow() {
          return {
            fromLeftEdge: {
              top: 1000,
              left: 1000,
              bottom: 1000,
            },
            forRightEdge: {
              top: 1000,
              right: 1000,
              bottom: 1000,
            },
          };
        },
      }),
    );
  }, [data, projectId, settings, setColumnMap]);

  // Panning the board
  useEffect(() => {
    let cleanupActive: CleanupFn | null = null;
    const scrollable = scrollableRef.current;
    invariant(scrollable);

    function begin({ startX }: { startX: number }) {
      let lastX = startX;

      const cleanupEvents = bindAll(
        window,
        [
          {
            type: 'pointermove',
            listener(event) {
              const currentX = event.clientX;
              const diffX = lastX - currentX;

              lastX = currentX;
              scrollable?.scrollBy({ left: diffX });
            },
          },
          // stop panning if we see any of these events
          ...(
            [
              'pointercancel',
              'pointerup',
              'pointerdown',
              'keydown',
              'resize',
              'click',
              'visibilitychange',
            ] as const
          ).map((eventName) => ({ type: eventName, listener: () => cleanupEvents() })),
        ],
        // need to make sure we are not after the "pointerdown" on the scrollable
        // Also this is helpful to make sure we always hear about events from this point
        { capture: true },
      );

      cleanupActive = cleanupEvents;
    }

    const cleanupStart = bindAll(scrollable, [
      {
        type: 'pointerdown',
        listener(event) {
          if (!(event.target instanceof HTMLElement)) {
            return;
          }
          // ignore interactive elements
          if (event.target.closest(`[${blockBoardPanningAttr}]`)) {
            return;
          }

          begin({ startX: event.clientX });
        },
      },
    ]);

    return function cleanupAll() {
      cleanupStart();
      cleanupActive?.();
    };
  }, []);

  return (
    <div className={`flex h-full flex-col ${settings.isBoardMoreObvious ? 'px-32 py-20' : ''}`}>
      <div
        className={`flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:theme(colors.sky.600)_theme(colors.sky.800)] [scrollbar-width:thin] ${settings.isBoardMoreObvious ? 'rounded border-2 border-dashed' : ''}`}
        ref={scrollableRef}
      >
        {data.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
