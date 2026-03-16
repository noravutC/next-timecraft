import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { slideVariants } from "../steps-create";

type StepCreateNameProps = {
  model: {
    orgName: string;
  };
  actions: {
    setOrgName: (value: string) => void;
    onNext: () => void;
  };
};

export function StepCreateName({ model, actions }: StepCreateNameProps) {
  return (
    <motion.div
      key="step0"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Let&apos;s set up your workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What should we call your organization?
        </p>
      </div>

      <Input
        placeholder="Organization name"
        value={model.orgName}
        onChange={(event) => actions.setOrgName(event.target.value)}
        autoFocus
        className="mb-6"
      />

      <Button
        onClick={actions.onNext}
        disabled={!model.orgName.trim()}
        className="w-full"
      >
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
