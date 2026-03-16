"use client";

import React from "react";
export const Header = () => {
  return (
    <div className="w-full h-full flex items-center hover:bg-gray-100 rounded px-4 relative select-none">
      <div className="min-w-8 min-h-8 rounded-full border" />
      <div className="flex flex-col items-start justify-center w-full h-10 ml-4">
        <div className="text-sm font-bold">Time Craft</div>
        <div className="text-xs opacity-[70%]">Software Project</div>
      </div>
    </div>
  );
};
