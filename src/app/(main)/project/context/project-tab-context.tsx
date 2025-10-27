// /app/project/context/project-tab-context.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ProjectTabValue = 'Board' | 'Board Templates' | 'Calendar' | string;

interface ProjectTabContextType {
    tabValue: ProjectTabValue;
    setTabValue: (tab: ProjectTabValue) => void;
}

const ProjectTabContext = createContext<ProjectTabContextType | undefined>(undefined);

export const ProjectTabProvider = ({ children }: { children: ReactNode }) => {
    const [tabValue, setTabValue] = useState<ProjectTabValue>("Board"); 

    return (
        <ProjectTabContext.Provider value={{ tabValue, setTabValue }}>
            {children}
        </ProjectTabContext.Provider>
    );
};

export const useProjectTab = () => {
    const context = useContext(ProjectTabContext);
    if (context === undefined) {
        throw new Error('useProjectTab must be used within a ProjectTabProvider');
    }
    return context;
};