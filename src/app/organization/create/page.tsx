"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreateOrganization } from "./steps-create";
import { LoaderScreen } from "@/components/ui/loader";
import { signInDestination } from "@/helper/utils/sign-in-destination";

export default function CreateOrganizationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const canCreateOrg = session?.user.canCreateOrg ?? false;
  const organizationId = session?.user.organizationId?.trim() ?? "";

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (
      sessionStatus === "authenticated" &&
      signInDestination({ organizationId, canCreateOrg }) === "/project"
    ) {
      router.replace("/project");
    }
  }, [sessionStatus, organizationId, canCreateOrg, router]);

  if (sessionStatus === "loading") {
    return <LoaderScreen />;
  }

  return <CreateOrganization />;
}
