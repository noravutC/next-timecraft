'use client';

import * as React from "react";
import { ScrollBar } from "@/components/ui/scroll-area";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { useEffect, useRef } from "react";

export const HorizontalMouseWheelScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    const scrollHoriz = React.useCallback((delta: number) => {
        if (!viewportRef.current) return;
        viewportRef.current.scrollLeft += delta;
    }, []);

    useEffect(() => {
        const rootEl = rootRef.current ?? window;
        const handler = (ev: WheelEvent) => {
            const clientX = ev.clientX;
            const clientY = ev.clientY;
            const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;

            const isOverColumn = !!(el && el.closest && el.closest('[data-board-column]'));

            if (isOverColumn) {
                return;
            }
            ev.preventDefault();
            const delta = ev.deltaX !== 0 ? ev.deltaX : ev.deltaY;
            const multiplier = 1;
            scrollHoriz(delta * multiplier);
        };
        (rootEl as EventTarget).addEventListener("wheel", handler as EventListener, {
            passive: false,
            capture: true,
        });

        return () => {
            (rootEl as EventTarget).removeEventListener("wheel", handler as EventListener, {
                capture: true,
            } as EventListenerOptions);
        };
    }, [scrollHoriz]);

    return (
        <ScrollAreaPrimitive.Root ref={ref as any} className={className} {...props}>
            <ScrollAreaPrimitive.Viewport
                ref={viewportRef as any}
                className="h-full w-full rounded-[inherit] [&>div]:!block"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>

            <ScrollBar orientation="horizontal" />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
});

HorizontalMouseWheelScrollArea.displayName = "HorizontalMouseWheelScrollArea";