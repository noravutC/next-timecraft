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
import { Ellipsis, Plus } from "lucide-react";
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
import { hexToRgba } from "@/helper/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShallow } from "zustand/react/shallow";
import { useColumnStore } from "@/store/use-column.store";

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

const CardList = memo(function CardList({ column }: { column: TColumn }) {
  return column.cards.map((card) => (
    <Card key={card.id} card={card} columnId={column.id} />
  ));
});

export const Column = ({ column }: { column: TColumn }) => {
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
  const backgroundStyle = column.color
    ? { background: hexToRgba(column.color, 0.6) }
    : {};

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
      className={cn("flex w-72 flex-shrink-0 select-none flex-col")}
      ref={outerFullHeightRef}
    >
      <div
        className={cn(
          `flex max-h-160 flex-col rounded-md text-gray-800 border overflow-hidden ${stateStyles[state.type]}`,
        )}
        ref={innerRef}
        {...{ [blockBoardPanningAttr]: true }}
      >
        <div
          className={`flex max-h-full bg-white flex-col ${state.type === "is-column-over" ? "invisible" : ""}`}
        >
          <div
            className={cn(
              "flex flex-row items-center justify-between p-2 mb-1",
            )}
            style={backgroundStyle}
            ref={headerRef}
          >
            <div className="pl-2 font-semibold leading-4 text-sm">
              {column.title}
            </div>
            <div className="w-fit flex items-center gap-2 justify-end">
              <Badge variant="outline" className="bg-white rounded-full">
                {column.totalTasks} task
              </Badge>
              {/* <Button type="button" size="xs" className="cursor-pointer bg-gray-700/40 hover:bg-gray-700/60" aria-label="More actions">
                <Ellipsis size={16} />
              </Button> */}
            </div>
          </div>
          <div
            className={
              "flex flex-col overflow-y-auto [overflow-anchor:none] [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]"
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
              <CardList column={column} />
            )}
            {state.type === "is-card-over" && !state.isOverChildCard && (
              <div className="flex-shrink-0 px-3 py-1">
                <CardShadow dragging={state.dragging} />
              </div>
            )}
          </div>
          <div className="flex flex-row gap-2 p-2">
            <button
              type="button"
              className="flex cursor-pointer flex-grow justify-start flex-row gap-2 rounded hover:bg-gray-100 active:bg-gray-100 text-sm text-gray-700 p-2 py-3"
            >
              <Plus size={16} />
              <div className="leading-4 font-semibold">Add a card</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
