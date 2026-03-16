"use client";

import { useEffect, useState } from "react";
import { CreateOrganizationProgress } from "./components/create-organization-progress";
import { StepCreateInvite } from "./components/step-create-invite";
import { StepCreateLogo } from "./components/step-create-logo";
import { StepCreateName } from "./components/step-create-name";
import { PreparedOrganizationData } from "./create-organization.types";
import { AnimatePresence } from "framer-motion";
import { useOrganizationStore } from "@/store/use-organization.store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const STEP_LABELS = ["Name", "Logo", "Invite"];
export const slideVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const uniqueEmails = (emails: string[]) => Array.from(new Set(emails));

export const CreateOrganization = () => {
  const router = useRouter();
  const { update } = useSession();
  const { createOrganization } = useOrganizationStore();

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [preparedData, setPreparedData] =
    useState<PreparedOrganizationData | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  const addEmail = () => {
    const nextEmail = emailInput.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@") || emails.includes(nextEmail)) {
      return;
    }
    setEmails((previous) => [...previous, nextEmail]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails((previous) => previous.filter((value) => value !== email));
  };

  const onFinish = async () => {
    setPreparing(true);

    const payload = {
      name: orgName.trim(),
      description: null,
    };

    setPreparedData({
      organization: {
        name: payload.name,
        logoFileName: logoFile?.name ?? null,
      },
      invitations: uniqueEmails(emails).map((email) => ({
        email,
        role: "member",
      })),
      meta: {
        preparedAt: new Date().toISOString(),
      },
    });

    if (!payload.name) {
      toast.error("Organization name is required");
      setPreparing(false);
      return;
    }

    try {
      const createdOrganization = await createOrganization(payload);
      if (!createdOrganization) {
        toast.error("Unable to create organization");
        return;
      }

      await update({
        user: {
          organizationId: createdOrganization.id,
          systemRole: "owner",
          canCreateOrg: false,
        },
      });
      toast.success("Organization created successfully");
      router.replace("/project");
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error("Unable to create organization");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="w-full max-w-md">
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
            model={{ logoPreview }}
            actions={{
              onFileChange: setLogoFile,
              onBack: () => setStep(0),
              onNext: () => setStep(2),
              onSkip: () => {
                setLogoFile(null);
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
              preparedData,
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
  );
};
