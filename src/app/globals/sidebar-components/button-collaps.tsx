"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// components
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CollapsButtonMenu {
  menuOptions?: {
    label: string;
    icon?: React.ReactNode;
    link: string;
    view?: boolean;
  }[];
  mainLabel: string;
  mainIcon: React.ReactNode;
}

interface CollapsButtonProps extends CollapsButtonMenu {
  pathname: string;
}

const RECENT_PROJECTS_KEY = "recentProjects";

export const CollapsButton = ({
  menuOptions = [],
  mainLabel = "Menu",
  mainIcon,
  pathname,
}: CollapsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const router = useRouter();

  const addRecentProject = (link: string) => {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    // Move to front, remove duplicates, limit to 5
    const updated = [link, ...parsed.filter((item: string) => item !== link)].slice(0, 5);

    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="w-full currsor-pointer text-[var(--text-color-primary)] select-none">
      <Button
        onClick={toggleMenu}
        className="w-full justify-between items-center gap-2 border-none shadow-none"
        variant="outline"
      >
        <div className="flex items-center gap-2 ">
          {mainIcon}
          {mainLabel}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <div className="flex flex-col mt-2">
          {menuOptions.map((option, i) => {
            const isActive = pathname === option.link;
            return ( // Only take first 3
              <React.Fragment key={i}>
                {option.view && (
                  <div
                    className={`w-full rounded ml-4 p-2 flex items-center gap-2 text-sm font-medium cursor-pointer
                  hover:bg-gray-100 ${isActive ? "bg-blue-100 text-blue-600" : ""}`}
                    onClick={() => {
                      addRecentProject(option.link);
                      router.push(option.link);
                    }}
                  // onClick={() => router.push(option.link)}
                  >
                    {option.icon}
                    {option.label}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  );
};
