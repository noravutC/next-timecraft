import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("tc-skel rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
