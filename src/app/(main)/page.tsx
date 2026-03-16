"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// import { LoaderPage } from "@/components/Loader-page";
import { LogoAnimation } from "@/components/logo-space/logo-animation";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";

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

  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LogoAnimationLoop />
      </div>
    );
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LogoAnimation />
      </div>
    );
  }
}
