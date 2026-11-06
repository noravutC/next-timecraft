import { cn } from "@/lib/utils";

type CreateOrganizationProgressProps = {
  step: number;
  labels: string[];
};

/** One bar per step; bars up to the current step are ink. */
export function CreateOrganizationProgress({
  step,
  labels,
}: CreateOrganizationProgressProps) {
  return (
    <ol aria-label="Progress" className="flex gap-2">
      {labels.map((label, index) => (
        <li
          key={label}
          aria-current={index === step ? "step" : undefined}
          className="flex flex-1 flex-col gap-2"
        >
          <span
            className={cn(
              "h-0.75 rounded-full",
              index <= step ? "bg-ink" : "bg-line",
            )}
          />
          <span
            className={cn(
              "text-xs leading-5 font-medium",
              index <= step ? "text-ink" : "text-ink-subtle",
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
