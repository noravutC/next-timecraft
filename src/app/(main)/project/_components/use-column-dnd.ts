import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import { RefObject, useContext, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import {
  getColumnData,
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  TCardData,
  TColumn,
} from './data';
import { isSafari } from './is-safari';
import { isShallowEqual } from './is-shallow-equal';
import { SettingsContext } from '@/context/kanban/setting-provider';

export type TColumnState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-column-over' }
  | { type: 'is-card-over'; isOverChildCard: boolean; dragging: DOMRect };

const idle: TColumnState = { type: 'idle' };

/**
 * DnD wiring ของ column ทั้งก้อน: draggable header, drop target, auto-scroll.
 * เป็นเจ้าของ drag state — component รับ state ไปเลือก style อย่างเดียว
 */
export function useColumnDnd({
  column,
  outerRef,
  scrollableRef,
  headerRef,
  innerRef,
}: {
  column: TColumn;
  outerRef: RefObject<HTMLDivElement | null>;
  scrollableRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  innerRef: RefObject<HTMLDivElement | null>;
}): TColumnState {
  const { settings } = useContext(SettingsContext);
  const [state, setState] = useState<TColumnState>(idle);
  // ref เก็บ column ล่าสุด ป้องกัน effect re-run ทุกครั้งที่ card เปลี่ยน
  const columnRef = useRef(column);
  columnRef.current = column;

  useEffect(() => {
    const outer = outerRef.current;
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
        type: 'is-card-over',
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
              if (!isSafari()) preview.style.transform = 'rotate(4deg)';
              container.appendChild(preview);
            },
          });
        },
        onDragStart: () => setState({ type: 'is-dragging' }),
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
            setState({ type: 'is-column-over' });
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
  }, [settings, outerRef, scrollableRef, headerRef, innerRef]);

  return state;
}
