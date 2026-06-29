"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderScreen } from "@/components/ui/loader";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const organizationId = session?.user?.organizationId?.trim() ?? "";
  const canCreateOrg = session?.user?.canCreateOrg ?? false;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated") {
      if (organizationId) {
        router.replace("/project");
        return;
      }

      if (canCreateOrg) {
        router.replace("/organization/create");
        return;
      }

      router.replace("/project");
    }
  }, [status, organizationId, canCreateOrg, router]);

  return <LoaderScreen />;
}
