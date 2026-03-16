// /app/project/context/project-tab-context.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type ProjectTabValue =
  | "Board"
  | "Board Templates"
  | "Calendar"
  | "New Project"
  | string;

interface ProjectTabContextType {
  menuValue: ProjectTabValue;
  setMenuValue: (tab: ProjectTabValue) => void;
}

const ProjectTabContext = createContext<ProjectTabContextType | undefined>(
  undefined,
);

export const ProjectTabProvider = ({ children }: { children: ReactNode }) => {
  const [menuValue, setMenuValue] = useState<ProjectTabValue>("Board");

  return (
    <ProjectTabContext.Provider value={{ menuValue, setMenuValue }}>
      {children}
    </ProjectTabContext.Provider>
  );
};

export const useProjectAtMenu = () => {
  const context = useContext(ProjectTabContext);
  if (context === undefined) {
    throw new Error(
      "useProjectAtMenu must be used within a ProjectTabProvider",
    );
  }
  return context;
};
