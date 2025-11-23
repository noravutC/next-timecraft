import { ProjectTabProvider } from "./project/project-menu-context";
import { ProjectToolsLayout } from "./project/project-tools-layout";

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <ProjectTabProvider>
                <ProjectToolsLayout>
                    {children}
                </ProjectToolsLayout>
            </ProjectTabProvider>
        </>

    );
}