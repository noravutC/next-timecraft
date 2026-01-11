import React from 'react';


export const GhostColumn = React.memo(() => {
    return (
        <div className="h-[450px] w-[250px] bg-gray-200 rounded-md border"></div>
    )
})

export const GhostTask = React.memo(() => {
    return (
        <div className="h-[140px] w-full border rounded-md p-4 hover:shadow-md transition-shadow duration-200 flex flex-col gap-6 bg-gray-200">
            <div></div>
        </div>
    )
})