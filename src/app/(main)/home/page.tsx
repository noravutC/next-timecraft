"use client";

import React, { useEffect } from "react";
import './logo-animation.css';
import { LogoAnimation } from "@/components/logo-space/logo-animation";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";
import Image from "next/image";
import { KanbanBoard } from "./Kanban";

export default function Home() {
    return (
        <div className="h-full">
            <KanbanBoard />
        </div>
    )
    // return (
    //     <div className="w-full bg-white h-full flex items-center justify-center">
    //         {/* <LogoAnimation /> */}
    //         <LogoAnimationLoop />
    //     </div>
    // );
}
