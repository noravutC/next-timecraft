import React from "react";

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
    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="flex flex-col mb-4">
                <span className="text-gray-500 text-sm">{menu}</span>
                <span className="text-gray-700 font-semibold text-xl">{subHeading}</span>
            </div>
            <div className="max-w-full max-h-full w-full h-full">{children}</div>
        </div>
    )
}