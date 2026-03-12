import { Progress } from "@/components/ui/progress";

type CreateOrganizationProgressProps = {
  step: number;
  labels: string[];
};

export function CreateOrganizationProgress({
  step,
  labels,
}: CreateOrganizationProgressProps) {
  const progress = ((step + 1) / labels.length) * 100;

  return (
    <>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        {labels.map((label, index) => (
          <span
            key={label}
            className={index <= step ? "font-medium text-foreground" : ""}
          >
            {label}
          </span>
        ))}
      </div>
      <Progress value={progress} className="mb-8 h-1" />
    </>
  );
}
