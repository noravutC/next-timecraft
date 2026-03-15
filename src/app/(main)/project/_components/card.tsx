'use client';

import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { attachClosestEdge, extractClosestEdge, type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';
import { getCardData, getCardDropTargetData, isCardData, isDraggingACard, TCard } from './data';
import { isShallowEqual } from './is-shallow-equal';
import { isSafari } from './is-safari';
import { BarColumn } from './bar-column';
import { useShallow } from 'zustand/react/shallow';
import { useTaskStore } from '@/store/use-task.store';
import { LoaderCircle } from 'lucide-react';
import { formatDateToString } from '@/helper/utils';

type TCardState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'preview'; container: HTMLElement; dragging: DOMRect };

const idle: TCardState = { type: 'idle' };

const innerStyles: Partial<Record<TCardState['type'], string>> = {
  idle: 'hover:outline outline-2 outline-neutral-50 cursor-grab',
  'is-dragging': 'opacity-40',
};

const outerStyles: Partial<Record<TCardState['type'], string>> = {
  'is-dragging-and-left-self': 'hidden',
};

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return <div className="flex-shrink-0 rounded-md bg-gray-200" style={{ height: dragging.height }} />;
}

export function CardDisplay({
  card,
  state,
  outerRef,
  innerRef,
}: {
  card: TCard;
  state: TCardState;
  outerRef?: React.RefObject<HTMLDivElement | null>;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;
  return (
    <div ref={outerRef} className={`flex flex-shrink-0 flex-col gap-2 px-3 py-1 ${outerStyles[state.type] ?? ''}`}>
      {state.type === 'is-over' && state.closestEdge === 'top' && <CardShadow dragging={state.dragging} />}
      <div
        ref={innerRef}
        className={`rounded-md border bg-white p-4 min-h-30 text-gray-700 ${innerStyles[state.type] ?? ''}`}
        style={
          state.type === 'preview'
            ? { width: state.dragging.width, height: state.dragging.height, transform: !isSafari() ? 'rotate(4deg)' : undefined }
            : undefined
        }
      >
        <div className="text-sm">{card.title}</div>
        <div className="mb-4" />
        <BarColumn taskAtColumnId={card.columnId} />
        <div className="mb-4" />
        <div className='flex items-center justify-between'>
          <div className='text-xs text-gray-500'>
            {formatDateToString((formatDateToString(card.createdAt) ?? '-'))}
          </div>
          {isLoading && <LoaderCircle className="animate-spin size-4" />}
        </div>
      </div>
      {state.type === 'is-over' && state.closestEdge === 'bottom' && <CardShadow dragging={state.dragging} />}
    </div>
  );
}

export function Card({ card, columnId }: { card: TCard; columnId: string }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TCardState>(idle);

  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;

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
      const proposed: TCardState = { type: 'is-over', dragging: source.data.rect, closestEdge };
      setState((cur) => (isShallowEqual(proposed, cur) ? cur : proposed));
    };

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) => getCardData({ card, columnId, rect: element.getBoundingClientRect() }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          invariant(isCardData(source.data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: inner, input: location.current.input }),
            render({ container }) {
              setState({ type: 'preview', container, dragging: inner.getBoundingClientRect() });
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
          attachClosestEdge(getCardDropTargetData({ card, columnId }), { element, input, allowedEdges: ['top', 'bottom'] }),
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
  }, [card, columnId, isLoading]);

  return (
    <>
      <CardDisplay outerRef={outerRef} innerRef={innerRef} state={state} card={card} />
      {state.type === 'preview' && createPortal(<CardDisplay state={state} card={card} />, state.container)}
    </>
  );
}
