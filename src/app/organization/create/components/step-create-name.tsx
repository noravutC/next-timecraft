import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { slideVariants } from "../steps-create";
import { StepHeading } from "./step-heading";

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
    <motion.form
      key="step0"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      onSubmit={(event) => {
        event.preventDefault();
        if (model.orgName.trim()) actions.onNext();
      }}
      className="flex flex-col gap-6"
    >
      <StepHeading title="Name your workspace">
        Usually your team or company name. Boards and members live inside it.
      </StepHeading>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ob-name" className="leading-5">
          Workspace name
        </Label>
        <Input
          id="ob-name"
          placeholder="e.g. Northwind Studio"
          value={model.orgName}
          onChange={(event) => actions.setOrgName(event.target.value)}
          autoFocus
          className="h-10.5 rounded-lg px-3 text-md"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!model.orgName.trim()}
        className="h-10.5 w-full gap-2"
      >
        Continue
        <ArrowRight className="size-3.75" />
      </Button>
    </motion.form>
  );
}
