import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { slideVariants } from "../steps-create";
import { StepHeading } from "./step-heading";

type StepCreateInviteProps = {
  model: {
    emailInput: string;
    emails: string[];
    preparing: boolean;
  };
  actions: {
    setEmailInput: (value: string) => void;
    onAddEmail: () => void;
    onRemoveEmail: (email: string) => void;
    onBack: () => void;
    onFinish: () => void;
  };
};

export function StepCreateInvite({ model, actions }: StepCreateInviteProps) {
  return (
    <motion.div
      key="step2"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <StepHeading title="Invite your team">
        Add teammate emails now, or skip and invite them from a board later.
      </StepHeading>

      <div className="flex flex-col gap-2.5">
        <Label htmlFor="ob-email" className="leading-5">
          Email addresses
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.75 -translate-y-1/2 text-ink-subtle" />
            <Input
              id="ob-email"
              type="email"
              placeholder="teammate@company.com"
              value={model.emailInput}
              onChange={(event) => actions.setEmailInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  actions.onAddEmail();
                }
              }}
              className="h-10.5 rounded-lg pr-3 pl-8.75 text-md"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={actions.onAddEmail}
            className="h-10.5 px-4"
          >
            Add
          </Button>
        </div>

        {model.emails.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {model.emails.map((email) => (
              <span
                key={email}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-2.5 text-sm text-ink"
              >
                {email}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => actions.onRemoveEmail(email)}
                  aria-label={`Remove ${email}`}
                  className="size-5.5 rounded-full text-ink-subtle"
                >
                  <X className="size-3" />
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>

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
          size="lg"
          onClick={actions.onFinish}
          disabled={model.preparing}
          className="h-10.5"
        >
          {model.preparing ? "Creating…" : "Create workspace"}
        </Button>
      </div>
    </motion.div>
  );
}
