// types
import { ColumnDataTable } from "@/components/data-table/main-data-table";
import { Project } from "@/types";
import { useRouter } from "next/navigation";


export const projectColumn: ColumnDataTable<Project>[] = [
    {
        key: "name",
        label: "Name",
        render: (project) => {
            const router = useRouter();
            return (
                <div className="relative flex items-center">
                    <div
                        className="absolute w-[max-content] cursor-pointer hover:border-b hover:border-blue-500 hover:text-blue-500"
                        onClick={() => router.push(`/project/${project._id}`)}
                    >
                        {project.name}
                    </div>
                </div>
            )
        },
        isVisible: true,
        isSortable: true,
    },
    {
        key: "description",
        label: "Description",
        render: (project) => project.description,
        isVisible: true,
        isSortable: true,
    },
    // {
    //     key: "project_url",
    //     label: "Project URL",
    //     render: (project) => project.,
    //     isVisible: true,
    //     isSortable: true,
    // },

];