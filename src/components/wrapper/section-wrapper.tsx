import React from "react";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SectionWrapperProps {
    children: React.ReactNode;
    menu: string;
    subHeading: string;
}
export const SectionWrapper = ({
    children,
    menu = "",
    subHeading = "",
}: SectionWrapperProps) => {
    const router = useRouter();
    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
                <div className="max-h-[7vh] h-full w-full flex items-center justify-start">
                    <Button
                        variant={'ghost'}
                        //   onClick={() => setIsNewProject(false)}
                        onClick={() => router.push('/project')}
                        className="cursor-pointer select-none ml-2 text-gray-500 text-sm font-[500]"
                    >
                        <ArrowLeft size={13} />
                        Back to project
                    </Button>
                </div>
                <div className="max-h-[80vh] h-[80vh] w-full pl-2">
                    {/* <CreateProjectForm onCloseNewProject={setIsNewProject} /> */}
                    <div className="flex flex-col mb-4">
                        <span className="text-gray-500 text-sm">{menu}</span>
                        <span className="text-gray-700 font-semibold text-xl">{subHeading}</span>
                    </div>
                    <div className="max-w-full max-h-full w-full h-full">{children}</div>
                </div>
            </div>
        </div>
    )
}