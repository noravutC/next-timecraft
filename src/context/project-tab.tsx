import { ProjectTabProvider } from "./project/project-menu-context";

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <ProjectTabProvider>
                    {children}
            </ProjectTabProvider>
        </>

    );
}