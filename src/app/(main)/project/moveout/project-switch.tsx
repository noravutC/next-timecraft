import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatDateToString } from "@/helper/utils";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store";
import { ProjectCache } from "@/types";
import { Check, Plus, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";

interface ProjectSwitchProps {
  selectedProject: ProjectCache;
}
export const ProjectSwitch = ({ selectedProject }: ProjectSwitchProps) => {
  const { projects, projectIsUsing, setProjectIsUsing, setNeedCreateProject } =
    useProjectStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const projectList = Object.values(projects);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return projectList;
    return projectList.filter((project) =>
      project.name.toLowerCase().includes(search),
    );
  }, [searchTerm, projectList]);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-start gap-4 min-w-60 p-2 rounded-md hover:bg-gray-100 cursor-pointer duration-300",
              dropdownOpen && "bg-gray-100",
            )}
          >
            {/* <GalleryVerticalEnd /> */}
            <Avatar className="size-10 rounded-sm">
              <AvatarImage
                src={selectedProject.coverImage ?? undefined}
                alt={selectedProject.name}
              />
              <AvatarFallback
                className={cn(
                  "rounded-sm bg-blue-100 text-blue-500 font-semibold",
                )}
              >
                {selectedProject.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="text-gray-700 font-medium">
                {selectedProject.name}
              </div>
              <div className="text-gray-500 !text-xs">
                {formatDateToString(selectedProject.createdAt)}
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-90 flex flex-col p-0 pt-1 gap-1 mt-2"
          side="bottom"
          align="start"
        >
          <DropdownMenuLabel className="text-sm font-semibold text-gray-600 px-4">
            Switch project
          </DropdownMenuLabel>
          <div className="group mx-4 flex items-center ring-2 ring-white border ring-gray-300 rounded-sm px-2 duration-300 focus-within:ring-2 focus-within:border focus-within:border-blue-500  focus-within:ring-blue-500/20 focus-within:shadow-md">
            <Search className="size-5 text-gray-400 group-focus-within:text-blue-500" />
            <Input
              autoFocus
              placeholder="Find a project..."
              className="focus-visible:ring-0 border-none shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenuLabel className="px-4 text-xs font-semibold text-gray-600">
            Your projects
          </DropdownMenuLabel>
          <div className="max-h-60 overflow-y-auto scrollbar-thin-y">
            {filteredProjects.length === 0 && (
              <div className="w-full h-30 flex items-center justify-center">
                <div className="text-sm text-gray-500">No projects found</div>
              </div>
            )}
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="relative w-full flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setProjectIsUsing(project.id);
                  setDropdownOpen(false);
                }}
              >
                <div
                  className={cn(
                    "absolute left-0 w-[3px] rounded-tr rounded-br h-1/2 bg-blue-500",
                    projectIsUsing === project.id ? "opacity-100" : "opacity-0",
                  )}
                ></div>
                <div className="flex items-center gap-3">
                  {/* Project Avatar */}
                  <Avatar className="border min-h-8 min-w-8 size-8 rounded-md">
                    <AvatarImage
                      src={project.coverImage ?? undefined}
                      alt={project.name}
                    />
                    <AvatarFallback className="rounded-md bg-blue-100 text-blue-500 font-semibold">
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Project info */}
                  <div className="flex flex-col max-w-50">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {project.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateToString(project.createdAt)}
                    </span>
                  </div>
                </div>
                <Check
                  className={cn(
                    "size-4 text-blue-500",
                    projectIsUsing === project.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col bg-gray-50">
            <DropdownMenuLabel className="text-sm font-semibold text-gray-600 px-4">
              Management
            </DropdownMenuLabel>
            <div className="w-full mb-4 px-2">
              <div
                className="group w-full rounded-sm hover:bg-white cursor-pointer px-2 py-2 flex items-center gap-3"
                onClick={() => setNeedCreateProject(true)}
              >
                <div className="size-8 bg-white border border-dashed flex items-center gap-2 rounded-sm justify-center border-blue-500 duration-300">
                  <Plus className="size-5 text-blue-500 group-hover:text-blue-500 duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    New project
                  </span>
                  <span className="text-xs text-gray-500">
                    Create a new workspace
                  </span>
                </div>
              </div>
              <div className="group w-full rounded-sm hover:bg-white cursor-pointer px-2 py-2 flex items-center gap-3">
                <div className="size-8 bg-white border border-dashed flex items-center gap-2 rounded-sm border-gray-300 justify-center group-hover:border-blue-500 duration-300">
                  <Settings className="size-5 text-gray-500 group-hover:text-blue-500 duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    Settings
                  </span>
                  <span className="text-xs text-gray-500">
                    Manage preferences
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
