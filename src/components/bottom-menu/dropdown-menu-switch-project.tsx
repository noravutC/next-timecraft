import { useProjectStore } from '@/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, Folder, Layers } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const DropdownMenuSwitchProject = () => {
  const { projects, projectIsUsing } = useProjectStore();
  const projectList = Object.values(projects);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'relative h-full w-full max-w-30 min-w-max cursor-pointer overflow-hidden rounded-md text-muted-foreground duration-200 select-none',
            'hover:bg-foreground/10 hover:text-foreground/80',
            'data-[state=open]:bg-muted-foreground/20 data-[state=open]:text-foreground',
          )}
        >
          <span className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-sm font-semibold">
            <Layers className="size-3.5 shrink-0" />
            Switch Boards
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="mb-4 w-84">
        <DropdownMenuLabel className="text-xs font-semibold text-foreground">
          Switch boards
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projectList.length === 0 ? (
          <DropdownMenuItem disabled>No boards yet</DropdownMenuItem>
        ) : (
          projectList.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className={cn(
                'flex items-center justify-between',
                projectIsUsing === project.id &&
                  'bg-primary/10 font-medium text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary',
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar className="shrink-0 rounded-full size-6 text-xs text-primary">
                  <AvatarImage
                    src={project.coverImage ?? ''}
                    alt={project.name}
                  />
                  <AvatarFallback className="shrink-0 rounded text-xs text-primary">
                    <Folder className="size-4" />
                  </AvatarFallback>
                </Avatar>
                {project.name}
              </div>
              {projectIsUsing === project.id && (
                <Check className="text-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
