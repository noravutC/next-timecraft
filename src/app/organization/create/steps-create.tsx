"use client";

import { useState } from "react";
import { CreateOrganizationProgress } from "./components/create-organization-progress";
import { StepCreateInvite } from "./components/step-create-invite";
import { StepCreateLogo } from "./components/step-create-logo";
import { StepCreateName } from "./components/step-create-name";
import { AnimatePresence } from "framer-motion";
import { useOrganizationStore } from "@/store/use-organization.store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthHeader } from "@/components/auth/auth-header";
import { appendEmail } from "@/helper/utils/email-list";
import { useWorkspaceLogoPicker } from "@/components/workspace/use-workspace-logo-picker";
import { invitesSummary } from "@/helper/utils/invite-result";
import { browserTimeZone } from "@/helper/utils/time-zone";

const STEP_LABELS = ["Name", "Logo", "Invite"];
export const slideVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export const CreateOrganization = () => {
  const router = useRouter();
  const { update } = useSession();
  const { createOrganization, inviteToWorkspace } = useOrganizationStore();

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [preparing, setPreparing] = useState(false);

  const logo = useWorkspaceLogoPicker();

  const addEmail = () => {
    const nextEmails = appendEmail(emails, emailInput);
    if (!nextEmails) return;
    setEmails(nextEmails);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails((previous) => previous.filter((value) => value !== email));
  };

  const onFinish = async () => {
    const name = orgName.trim();
    if (!name) {
      toast.error("Workspace name is required");
      return;
    }

    setPreparing(true);
    try {
      const createdOrganization = await createOrganization({
        name,
        description: null,
        logo: logo.logo,
        timeZone: browserTimeZone(),
      });
      if (!createdOrganization) {
        toast.error("Unable to create workspace");
        return;
      }

      // the workspace exists either way: invitations are best effort
      let invites: string | null = null;
      if (emails.length > 0) {
        try {
          invites = invitesSummary(
            await inviteToWorkspace(createdOrganization.id, {
              emails,
              role: "member",
            }),
          );
        } catch {
          toast.error("The workspace is ready, but the invitations didn’t go out");
        }
      }

      // Payload is ignored server-side: update() just makes the jwt callback
      // re-read org/role from the DB (no argument would only GET the session).
      await update({});
      toast.success("Workspace created", { description: invites ?? undefined });
      router.replace("/project");
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error("Unable to create workspace");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <AuthHeader bordered>
        <span className="font-mono text-xs text-ink-subtle">
          Step {step + 1} of {STEP_LABELS.length}
        </span>
      </AuthHeader>

      <main className="flex flex-1 justify-center px-4 pt-18 pb-16">
        <div className="flex w-full max-w-110 flex-col gap-8">
          <CreateOrganizationProgress step={step} labels={STEP_LABELS} />
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepCreateName
                model={{ orgName }}
                actions={{
                  setOrgName,
                  onNext: () => setStep(1),
                }}
              />
            )}

            {step === 1 && (
              <StepCreateLogo
                model={{ logoPreview: logo.logo }}
                actions={{
                  onFileChange: (file) => void logo.pick(file),
                  onBack: () => setStep(0),
                  onNext: () => setStep(2),
                  onSkip: () => {
                    logo.clear();
                    setStep(2);
                  },
                }}
              />
            )}

            {step === 2 && (
              <StepCreateInvite
                model={{
                  emailInput,
                  emails,
                  preparing,
                }}
                actions={{
                  setEmailInput,
                  onAddEmail: addEmail,
                  onRemoveEmail: removeEmail,
                  onBack: () => setStep(1),
                  onFinish,
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
