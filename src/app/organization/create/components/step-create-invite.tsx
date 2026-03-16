import { ArrowLeft, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreparedOrganizationData } from "../create-organization.types";
import { motion } from "framer-motion";
import { slideVariants } from "../steps-create";

type StepCreateInviteProps = {
  model: {
    emailInput: string;
    emails: string[];
    preparing: boolean;
    preparedData: PreparedOrganizationData | null;
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
      key="step1"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Invite your team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add teammate emails before you start.
        </p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="teammate@email.com"
            value={model.emailInput}
            onChange={(event) => actions.setEmailInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                actions.onAddEmail();
              }
            }}
          />
          <Button variant="outline" size="icon" onClick={actions.onAddEmail}>
            <Mail className="h-4 w-4" />
          </Button>
        </div>

        {model.emails.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {model.emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                {email}
                <button
                  type="button"
                  onClick={() => actions.onRemoveEmail(email)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-3">
        <Button variant="outline" onClick={actions.onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={actions.onFinish}
          disabled={model.preparing}
          className="flex-1"
        >
          {model.preparing ? "Preparing..." : "Finish"}
        </Button>
      </div>

      {model.preparedData && (
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Prepared payload
          </p>
          <pre className="max-h-44 overflow-auto text-xs">
            {JSON.stringify(model.preparedData, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
}
