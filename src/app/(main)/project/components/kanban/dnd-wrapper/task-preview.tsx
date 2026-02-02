"use client";

import React, { CSSProperties, memo } from "react";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/hooks";
import { useShallow } from "zustand/react/shallow";

type Variant = "ghost" | "overlay";

interface TaskCardPreviewProps {
  taskId: string;
  variant?: Variant;

  /**
   * ใช้กำหนดความสูงคงที่ให้ ghost เพื่อกัน list กระโดด
   * ถ้าคุณไม่ส่ง จะใช้ 56px เป็นค่า default (ปรับตาม TaskCard จริง)
   */
  heightPx?: number;

  /**
   * สำหรับ overlay: ถ้าต้องการจำกัดความกว้าง
   */
  maxWidthPx?: number;
}

export const TaskCardPreview = memo(function TaskCardPreview({
  taskId,
  variant = "ghost",
  heightPx = 56,
  maxWidthPx = 320,
}: TaskCardPreviewProps) {
  const task = useTaskStore(useShallow((s) => s.tasks[taskId]));

  // กันกรณี task ยังไม่โหลด: render เป็น placeholder เปล่า ๆ
  const title = task?.title ?? " ";

  if (variant === "ghost") {
    // Ghost = placeholder ใน list
    const style: CSSProperties = { height: `${heightPx}px` };

    return (
      <div
        aria-hidden
        className={cn(
          "relative w-full rounded-md",
          "border border-dashed",
          "bg-secondary/20"
        )}
        style={style}
      >
        {/* เส้นชี้ตำแหน่ง */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2">
          <div className="h-[2px] w-full rounded bg-foreground/40" />
        </div>

        {/* จุด marker ซ้าย */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-foreground/50" />
      </div>
    );
  }

  // Overlay = การ์ดลอย (DragOverlay)
  const style: CSSProperties = {
    maxWidth: `${maxWidthPx}px`,
  };

  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-background",
        "shadow-lg",
        "opacity-95",
        "select-none"
      )}
      style={style}
    >
      <div className="px-3 py-2">
        <div className="text-sm font-medium leading-snug line-clamp-3">
          {title}
        </div>

        {/* meta แถวล่าง (optional) */}
        <div className="mt-2 h-3 w-24 rounded bg-foreground/10" />
      </div>
    </div>
  );
});
