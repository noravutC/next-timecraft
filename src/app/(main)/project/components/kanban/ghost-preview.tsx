import React from 'react';
import { cn } from "@/lib/utils";
export const GhostColumn = React.memo(() => {
    return (
        <div className="relative h-[450px] w-[250px] overflow-hidden rounded-md border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)]">
            <div className="pointer-events-none absolute -left-10 top-6 h-16 w-40 rotate-[-6deg] rounded-full bg-white/70 blur-xl" />
            <div className="pointer-events-none absolute -right-14 bottom-10 h-24 w-48 rotate-[6deg] rounded-full bg-slate-200/80 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.5),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(226,232,240,0.9),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(120deg,rgba(148,163,184,0.25)_0%,rgba(148,163,184,0.05)_30%,transparent_60%)]" />
            <div className="pointer-events-none absolute inset-x-3 top-4 h-2 rounded-full bg-slate-200/80" />
            <div className="pointer-events-none absolute inset-x-6 top-9 h-2 rounded-full bg-slate-200/60" />
        </div>
    )
})

type GhostTaskProps = {
    className?: string;
    style?: React.CSSProperties;
    height?: number;
};

type GhostVariant = "same-column" | "cross-column";

const GhostTaskBase = ({ className, style, height, variant }: GhostTaskProps & { variant: GhostVariant }) => {
    const isCrossColumn = variant === "cross-column";
    return (
        <div
            className={cn(
                "relative w-full overflow-hidden rounded-md border border-dashed p-4 transition-shadow duration-200",
                isCrossColumn
                    ? "border-slate-300 bg-[linear-gradient(115deg,rgba(226,232,240,0.9),rgba(248,250,252,0.9),rgba(226,232,240,0.95))] shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)]"
                    : "border-slate-300/70 bg-[linear-gradient(180deg,rgba(241,245,249,0.55),rgba(226,232,240,0.7))] shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]",
                className
            )}
            style={{ height: height ?? 140, ...style }}
        >
            <div className="pointer-events-none absolute -left-6 top-3 h-10 w-20 -rotate-6 rounded-full bg-white/70 blur-lg" />
            <div className="pointer-events-none absolute -right-10 bottom-2 h-16 w-28 rotate-6 rounded-full bg-slate-200/80 blur-2xl" />
            {isCrossColumn && (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(148,163,184,0.5),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(226,232,240,0.9),transparent_55%)]" />
            )}
            <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(135deg,rgba(148,163,184,0.18)_0%,transparent_45%,rgba(148,163,184,0.12)_75%)]" />
            <div className="relative flex flex-col gap-3">
                <div className={cn("h-3 rounded-full", isCrossColumn ? "w-2/3 bg-slate-200/80" : "w-3/4 bg-slate-200/70")} />
                <div className={cn("h-3 rounded-full", isCrossColumn ? "w-1/2 bg-slate-200/60" : "w-2/5 bg-slate-200/60")} />
                <div className={cn("mt-2 h-2 rounded-full", isCrossColumn ? "w-20 bg-slate-200/70" : "w-16 bg-slate-200/60")} />
            </div>
        </div>
    );
};

export const GhostTaskSameColumn = React.memo((props: GhostTaskProps) => (
    <GhostTaskBase {...props} variant="same-column" />
));

export const GhostTaskCrossColumn = React.memo((props: GhostTaskProps) => (
    <GhostTaskBase {...props} variant="cross-column" />
));

export const GhostTask = GhostTaskSameColumn;
