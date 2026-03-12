"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreateOrganization } from "./steps-create";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";

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

        if (sessionStatus === "authenticated" && (organizationId || !canCreateOrg)) {
            router.replace("/project");
        }
    }, [sessionStatus, organizationId, canCreateOrg, router]);

    if (sessionStatus === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LogoAnimationLoop />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <CreateOrganization />
        </div>
    );
}
