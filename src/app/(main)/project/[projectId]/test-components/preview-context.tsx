// context/PreviewContext.tsx
import React, { createContext, useContext, useState } from 'react';

type PreviewContextType = {
    activeTaskId: string | null;
    overColumnId: string | null;
    setActiveTaskId: (id: string | null) => void;
    setOverColumnId: (id: string | null) => void;
};

const PreviewContext = createContext<PreviewContextType | null>(null);

export const PreviewProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [overColumnId, setOverColumnId] = useState<string | null>(null);

    return (
        <PreviewContext.Provider value={{ activeTaskId, overColumnId, setActiveTaskId, setOverColumnId }}>
            {children}
        </PreviewContext.Provider>
    );
};

export const usePreview = () => {
    const context = useContext(PreviewContext);
    if (!context) throw new Error('usePreview must be used within a PreviewProvider');
    return context;
};
