import * as React from "react";
// 💡 ต้องนำเข้า ScrollArea, ScrollBar จากไฟล์ Shadcn ของคุณ
import { ScrollBar } from "@/components/ui/scroll-area"; 
// 💡 ต้องเข้าถึง Radix Primitive เพื่อจัดการ Viewport
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"; 

export const HorizontalMouseWheelScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
    
    const viewportRef = React.useRef<HTMLDivElement>(null);

    const onWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (viewportRef.current) {
            e.preventDefault(); 
            viewportRef.current.scrollLeft += e.deltaY;
        }
    }, []);

    return (
        <ScrollAreaPrimitive.Root
            ref={ref}
            className={className}
            type="scroll"
            {...props}
        >
            <ScrollAreaPrimitive.Viewport 
                ref={viewportRef}
                onWheel={onWheel}
                className="h-full w-full rounded-[inherit] [&>div]:!block" 
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            {/* ต้องมี ScrollBar แนวนอนเพื่อให้ Radix UI ทำงานถูกต้อง */}
            <ScrollBar orientation="horizontal" />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
});

HorizontalMouseWheelScrollArea.displayName = "HorizontalMouseWheelScrollArea";