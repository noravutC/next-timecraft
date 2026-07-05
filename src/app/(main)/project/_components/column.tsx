"use client";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { Plus } from "lucide-react";
import { memo, useContext, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import {
  getColumnData,
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  TCardData,
  TColumn,
} from "./data";
import { blockBoardPanningAttr } from "./data-attributes";
import { isSafari } from "./is-safari";
import { isShallowEqual } from "./is-shallow-equal";
import { Card, CardShadow } from "./card";
import { SettingsContext } from "@/context/kanban/setting-provider";
import { useTaskStore } from "@/store/use-task.store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShallow } from "zustand/react/shallow";
import { useColumnStore } from "@/store/use-column.store";
import { AddCardInline } from "./add-card-inline";

type TColumnState =
  | { type: "idle" }
  | { type: "is-dragging" }
  | { type: "is-column-over" }
  | { type: "is-card-over"; isOverChildCard: boolean; dragging: DOMRect };

const stateStyles: Record<TColumnState["type"], string> = {
  idle: "cursor-grab",
  "is-card-over": "outline outline-2 outline-neutral-50",
  "is-dragging": "opacity-40",
  "is-column-over": "bg-gray-200",
};

const idle: TColumnState = { type: "idle" };

const CardList = memo(function CardList({
  column,
  allColumns,
}: {
  column: TColumn;
  allColumns: TColumn[];
}) {
  return column.cards.map((card) => (
    <Card key={card.id} card={card} columnId={column.id} allColumns={allColumns} />
  ));
});

export const Column = ({
  column,
  allColumns,
}: {
  column: TColumn;
  allColumns: TColumn[];
}) => {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const outerFullHeightRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  // ref เก็บ column ล่าสุด ป้องกัน effect re-run ทุกครั้งที่ card เปลี่ยน
  const columnRef = useRef(column);
  columnRef.current = column;

  const { settings } = useContext(SettingsContext);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);
  const columnsLoader = useColumnStore(useShallow((s) => s.columnsLoader));
  const isLoading = columnsLoader[column.id] ?? false;
  const [state, setState] = useState<TColumnState>(idle);
  const [isAdding, setIsAdding] = useState(false);

  // fetch tasks ของ column นี้เมื่อ mount
  useEffect(() => {
    fetchTasksByColumns([column.id], 50).catch(() => {});
  }, [column.id, fetchTasksByColumns]);

  useEffect(() => {
    const outer = outerFullHeightRef.current;
    const scrollable = scrollableRef.current;
    const header = headerRef.current;
    const inner = innerRef.current;
    invariant(outer && scrollable && header && inner);

    const getColData = () => getColumnData({ column: columnRef.current });

    const setIsCardOver = ({
      data,
      location,
    }: {
      data: TCardData;
      location: DragLocationHistory;
    }) => {
      const isOverChildCard = Boolean(
        location.current.dropTargets[0] &&
        isCardDropTargetData(location.current.dropTargets[0].data),
      );
      const proposed: TColumnState = {
        type: "is-card-over",
        dragging: data.rect,
        isOverChildCard,
      };
      setState((cur) => (isShallowEqual(proposed, cur) ? cur : proposed));
    };

    const scrollConfig = { maxScrollSpeed: settings.columnScrollSpeed };
    const canCardScroll = ({
      source,
    }: {
      source: { data: Record<string | symbol, unknown> };
    }) =>
      settings.isOverElementAutoScrollEnabled && isDraggingACard({ source });

    return combine(
      draggable({
        element: header,
        getInitialData: getColData,
        onGenerateDragPreview({ source, location, nativeSetDragImage }) {
          invariant(isColumnData(source.data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: header,
              input: location.current.input,
            }),
            render({ container }) {
              const rect = inner.getBoundingClientRect();
              const preview = inner.cloneNode(true) as HTMLElement;
              preview.style.width = `${rect.width}px`;
              preview.style.height = `${rect.height}px`;
              if (!isSafari()) preview.style.transform = "rotate(4deg)";
              container.appendChild(preview);
            },
          });
        },
        onDragStart: () => setState({ type: "is-dragging" }),
        onDrop: () => setState(idle),
      }),
      dropTargetForElements({
        element: outer,
        getData: getColData,
        canDrop: ({ source }) =>
          isDraggingACard({ source }) || isDraggingAColumn({ source }),
        getIsSticky: () => true,
        onDragStart({ source, location }) {
          if (isCardData(source.data))
            setIsCardOver({ data: source.data, location });
        },
        onDragEnter({ source, location }) {
          if (isCardData(source.data)) {
            setIsCardOver({ data: source.data, location });
            return;
          }
          if (
            isColumnData(source.data) &&
            source.data.column.id !== columnRef.current.id
          ) {
            setState({ type: "is-column-over" });
          }
        },
        onDropTargetChange({ source, location }) {
          if (isCardData(source.data))
            setIsCardOver({ data: source.data, location });
        },
        onDragLeave({ source }) {
          if (
            isColumnData(source.data) &&
            source.data.column.id === columnRef.current.id
          )
            return;
          setState(idle);
        },
        onDrop: () => setState(idle),
      }),
      autoScrollForElements({
        element: scrollable,
        getConfiguration: () => scrollConfig,
        canScroll: canCardScroll,
      }),
      unsafeOverflowAutoScrollForElements({
        element: scrollable,
        getConfiguration: () => scrollConfig,
        canScroll: ({ source }) =>
          canCardScroll({ source }) && settings.isOverflowScrollingEnabled,
        getOverflow: () => ({
          fromTopEdge: { top: 1000, left: 1000, right: 1000 },
          forBottomEdge: { bottom: 1000 },
        }),
      }),
    );
  }, [settings]);

  return (
    <div
      className={cn("flex w-[290px] flex-shrink-0 select-none flex-col")}
      ref={outerFullHeightRef}
    >
      <div
        className={cn(
          `flex max-h-[calc(100vh-14rem)] min-h-60 flex-col overflow-hidden rounded-xl text-gray-800 ${stateStyles[state.type]}`,
        )}
        ref={innerRef}
        {...{ [blockBoardPanningAttr]: true }}
      >
        <div
          className={`flex min-h-0 max-h-full flex-1 flex-col ${state.type === "is-column-over" ? "invisible" : ""}`}
        >
          <div
            className="mb-1 flex flex-row items-center gap-2 px-1.5 pt-0.5 pb-3"
            ref={headerRef}
          >
            <span
              className="size-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: column.color ?? "#94A3B8" }}
            />
            <div className="text-xs font-bold tracking-wide text-[#6B7180] uppercase">
              {column.title}
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-transparent bg-[#EDEEF2] px-1.75 py-0.25 text-[11px] font-semibold text-[#A2A7B3]"
            >
              {column.totalTasks}
            </Badge>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              aria-label="Add a card"
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-[#B6BAC4] hover:bg-[#E9EAEF] hover:text-[#5B50E6]"
            >
              <Plus size={16} />
            </button>
          </div>
          <div
            className={
              "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto [overflow-anchor:none] scrollbar-thin-y scrollbar-light"
            }
            ref={scrollableRef}
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-25 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <CardList column={column} allColumns={allColumns} />
            )}
            {state.type === "is-card-over" && !state.isOverChildCard && (
              <div className="flex-shrink-0 px-3 py-1">
                <CardShadow dragging={state.dragging} />
              </div>
            )}
          </div>
          {isAdding ? (
            <AddCardInline
              columnId={column.id}
              lastOrderFraction={column.cards.at(-1)?.orderFraction ?? null}
              onClose={() => setIsAdding(false)}
            />
          ) : (
            <div className="px-1 pt-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex w-full cursor-pointer flex-row items-center gap-1.75 rounded-md p-2.5 text-left text-sm font-semibold text-[#9499A5] hover:bg-[#EDEEF2] hover:text-[#5B50E6]"
              >
                <Plus size={15} />
                Add a card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
