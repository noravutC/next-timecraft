import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { RefObject, useEffect, useState } from 'react';
import invariant from 'tiny-invariant';
import {
  getCardData,
  getCardDropTargetData,
  isCardData,
  isDraggingACard,
  TCard,
} from './data';
import { isShallowEqual } from './is-shallow-equal';

export type TCardState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'preview'; container: HTMLElement; dragging: DOMRect };

const idle: TCardState = { type: 'idle' };

/**
 * DnD wiring ของการ์ด: draggable + drop target + drag-preview state.
 * เป็นเจ้าของ card state — component รับ state ไปเลือก style/render preview
 */
export function useCardDnd({
  card,
  columnId,
  isLoading,
  outerRef,
  innerRef,
}: {
  card: TCard;
  columnId: string;
  isLoading: boolean;
  outerRef: RefObject<HTMLDivElement | null>;
  innerRef: RefObject<HTMLDivElement | null>;
}): TCardState {
  const [state, setState] = useState<TCardState>(idle);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    invariant(outer && inner);

    if (isLoading) return;

    // ใช้ร่วมกันระหว่าง onDragEnter และ onDrag
    const updateIsOver = (
      source: { data: Record<string | symbol, unknown> },
      selfData: Record<string | symbol, unknown>,
    ) => {
      if (!isCardData(source.data) || source.data.card.id === card.id) return;
      const closestEdge = extractClosestEdge(selfData);
      if (!closestEdge) return;
      const proposed: TCardState = {
        type: 'is-over',
        dragging: source.data.rect,
        closestEdge,
      };
      setState((cur) => (isShallowEqual(proposed, cur) ? cur : proposed));
    };

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getCardData({
            card,
            columnId,
            rect: element.getBoundingClientRect(),
          }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          invariant(isCardData(source.data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: inner,
              input: location.current.input,
            }),
            render({ container }) {
              setState({
                type: 'preview',
                container,
                dragging: inner.getBoundingClientRect(),
              });
            },
          });
        },
        onDragStart: () => setState({ type: 'is-dragging' }),
        onDrop: () => setState(idle),
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        canDrop: isDraggingACard,
        getData: ({ element, input }) =>
          attachClosestEdge(getCardDropTargetData({ card, columnId }), {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDragEnter: ({ source, self }) => updateIsOver(source, self.data),
        onDrag: ({ source, self }) => updateIsOver(source, self.data),
        onDragLeave({ source }) {
          if (isCardData(source.data) && source.data.card.id === card.id) {
            setState({ type: 'is-dragging-and-left-self' });
            return;
          }
          setState(idle);
        },
        onDrop: () => setState(idle),
      }),
    );
  }, [card, columnId, isLoading, outerRef, innerRef]);

  return state;
}
