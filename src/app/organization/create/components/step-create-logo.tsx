import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { slideVariants } from "../steps-create";

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

export function StepCreateLogo({
  model,
  actions,
}: StepCreateLogoProps) {
  return (
    <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Add a logo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your workspace a visual identity.
        </p>
      </div>

      <label className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-foreground/30">
        {model.logoPreview ? (
          <img
            src={model.logoPreview}
            alt="Logo preview"
            className="h-24 w-24 rounded-lg object-cover"
          />
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload your logo
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => actions.onFileChange(event.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      <div className="flex gap-3">
        <Button variant="outline" onClick={actions.onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={actions.onNext} className="flex-1">
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <button
        type="button"
        onClick={actions.onSkip}
        className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
