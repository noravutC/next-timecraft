"use client";

import React, { useEffect, useState } from "react";
// components
import { Button } from "@/components/ui/button";
import { DropdownMenuDemo } from "./topbar-components/menu-option";
import timecraftLogo from "@/../public/timecraft-logo.svg";
import { ChevronDown } from "lucide-react";

// Don't used yet
export const Topbar = () => {
  return (
    <div className="w-full flex items-center gap-4 px-4">
      <div className="w-40 flex items-center gap-2">
        <div className="w-[max-content] h-[max-content]">
          <img
            src={timecraftLogo.src}
            alt="Timecraft Logo"
            className="w-8 h-8"
          />
        </div>
        <div className="text-md font-bold">Time Craft</div>
      </div>
      <div className="w-full flex-1 border"></div>
      <div className="w-20 flex items-center justify-end">
        <DropdownMenuDemo />
      </div>
    </div>
  );
};
