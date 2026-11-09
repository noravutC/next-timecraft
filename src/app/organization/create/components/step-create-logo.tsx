import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { firstImageFile } from "@/helper/utils/image-file";
import { slideVariants } from "../steps-create";
import { StepHeading } from "./step-heading";

type StepCreateLogoProps = {
  model: {
    logoPreview: string | null;
  };
  actions: {
    onFileChange: (file: File | null) => void;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
  };
};

export function StepCreateLogo({ model, actions }: StepCreateLogoProps) {
  return (
    <motion.div
      key="step1"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepHeading title="Add a logo">
        Optional. You can skip this for now.
      </StepHeading>

      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = firstImageFile(event.dataTransfer.files);
          if (file) actions.onFileChange(file);
        }}
        className="relative flex cursor-pointer flex-col items-center gap-2.5 rounded-popover border border-dashed border-line-strong px-4 py-8 text-center transition-colors hover:border-neutral-400 hover:bg-surface"
      >
        {model.logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img
            src={model.logoPreview}
            alt="Logo preview"
            className="size-16 rounded-popover border border-line object-cover"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-popover border border-line bg-background text-ink-muted">
            <Upload className="size-4.5" />
          </span>
        )}
        <span className="text-base font-medium text-ink">
          Drop an image or{" "}
          <span className="underline underline-offset-3">browse</span>
        </span>
        <span className="text-xs leading-5 text-ink-subtle">
          PNG, JPG or SVG, square works best
        </span>
        <Input
          type="file"
          accept="image/*"
          aria-label="Upload logo"
          onChange={(event) => {
            const file = firstImageFile(event.target.files);
            if (file) actions.onFileChange(file);
          }}
          className="sr-only"
        />
      </label>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={actions.onBack}
          className="h-10.5 px-4"
        >
          Back
        </Button>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="lg"
          onClick={actions.onSkip}
          className="h-10.5 px-3.5"
        >
          Skip for now
        </Button>
        <Button size="lg" onClick={actions.onNext} className="h-10.5">
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
