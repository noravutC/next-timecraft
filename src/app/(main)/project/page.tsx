// projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
// hooks
import { useProjectStore } from '@/src/hooks/useProjects';
// components
import { MainDataTanle } from "@/components/data-table/main-data-table";
// types
import { projectColumn } from "./project-columns";
import { type Projects } from "@/src/types";

export default function Projects() {
  const { fetchProjects, getProjectById } = useProjectStore();
  const [projects, setProjects] = useState<Projects[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      const response = await fetchProjects();
      setProjects(response);
    };

    loadProjects();
  }, []);
  
  return (
    <>
      <div className="max-w-full h-full overflow-x-hidden overflow-y-auto">
        <MainDataTanle data={projects} columns={projectColumn} />
      </div>
    </>
  )
}